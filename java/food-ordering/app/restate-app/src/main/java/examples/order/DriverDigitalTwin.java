/*
 * Copyright (c) 2024 - Restate Software, Inc., Restate GmbH
 *
 * This file is part of the Restate examples,
 * which is released under the MIT license.
 *
 * You can find a copy of the license in the file LICENSE
 * in the root directory of this repository or package or at
 * https://github.com/restatedev/examples/
 */

package examples.order;

import static examples.order.generated.OrderProto.*;

import com.google.protobuf.Empty;
import dev.restate.sdk.KeyedContext;
import dev.restate.sdk.common.StateKey;
import dev.restate.sdk.common.TerminalException;
import examples.order.generated.DriverDeliveryMatcherRestate;
import examples.order.generated.DriverDigitalTwinRestate;
import examples.order.types.AssignedDelivery;
import examples.order.types.DriverStatus;
import examples.order.types.Location;
import dev.restate.sdk.serde.jackson.JacksonSerdes;

/**
 * Digital twin for the driver. Represents a driver and his status, assigned delivery, and location.
 * Keyed by driver ID. The actual driver would have an application (mocked by
 * DriverMobileAppSimulator ) that calls this service.
 */
public class DriverDigitalTwin extends DriverDigitalTwinRestate.DriverDigitalTwinRestateImplBase {

  // Current status of the driver: idle, waiting for work, or delivering
  private static final StateKey<DriverStatus> DRIVER_STATUS =
      StateKey.of("driver-status", JacksonSerdes.of(DriverStatus.class));

  // Only set if the driver is currently doing a delivery
  private static final StateKey<AssignedDelivery> ASSIGNED_DELIVERY =
      StateKey.of("assigned-delivery", JacksonSerdes.of(AssignedDelivery.class));

  // Current location of the driver
  private static final StateKey<Location> DRIVER_LOCATION =
      StateKey.of("driver-location", JacksonSerdes.of(Location.class));

  /**
   * When the driver starts his work day or finishes a delivery, his application
   * (DriverMobileAppSimulator) calls this method.
   */
  @Override
  public void setDriverAvailable(KeyedContext ctx, DriverAvailableNotification request)
      throws TerminalException {
    expectStatus(ctx, DriverStatus.IDLE);

    ctx.set(DRIVER_STATUS, DriverStatus.WAITING_FOR_WORK);
    DriverDeliveryMatcherRestate.newClient(ctx)
        .oneWay()
        .setDriverAvailable(
            DriverPoolAvailableNotification.newBuilder()
                .setRegion(request.getRegion())
                .setDriverId(request.getDriverId())
                .build());
  }

  /**
   * Gets called by the delivery manager when this driver was assigned to do the delivery. Updates
   * the status of the digital driver twin, and notifies the delivery service of its current
   * location.
   */
  @Override
  public void assignDeliveryJob(KeyedContext ctx, AssignDeliveryRequest request)
      throws TerminalException {
    expectStatus(ctx, DriverStatus.WAITING_FOR_WORK);

    // Update the status and assigned delivery information of the driver
    ctx.set(DRIVER_STATUS, DriverStatus.DELIVERING);
    ctx.set(
        ASSIGNED_DELIVERY,
        new AssignedDelivery(
            request.getDriverId(),
            request.getOrderId(),
            request.getRestaurantId(),
            Location.fromProto(request.getRestaurantLocation()),
            Location.fromProto(request.getCustomerLocation())));

    // Notify current location to the delivery service
    ctx.get(DRIVER_LOCATION)
        .ifPresent(
            loc ->
                new OrderWorkflowRestateClient(ctx, request.getOrderId())
                    .oneWay()
                    .handleDriverLocationUpdate(loc));
  }

  /**
   * Gets called by the driver's mobile app when he has picked up the delivery from the restaurant.
   */
  @Override
  public void notifyDeliveryPickup(KeyedContext ctx, DriverId request) throws TerminalException {
    expectStatus(ctx, DriverStatus.DELIVERING);

    // Retrieve the ongoing delivery and update its status
    var currentDelivery =
        ctx.get(ASSIGNED_DELIVERY)
            .orElseThrow(
                () ->
                    new TerminalException(
                        "Driver is in status DELIVERING but there is no current delivery set."));
    currentDelivery.notifyPickup();
    ctx.set(ASSIGNED_DELIVERY, currentDelivery);

    // Update the status of the delivery in the delivery manager
    new OrderWorkflowRestateClient(ctx, currentDelivery.getOrderId())
            .oneWay()
                    .notifyDeliveryPickup();
  }

  /** Gets called by the driver's mobile app when he has delivered the order to the customer. */
  @Override
  public void notifyDeliveryDelivered(KeyedContext ctx, DriverId request)
      throws TerminalException {
    expectStatus(ctx, DriverStatus.DELIVERING);

    // Retrieve the ongoing delivery
    var assignedDelivery =
        ctx.get(ASSIGNED_DELIVERY)
            .orElseThrow(
                () ->
                    new TerminalException(
                        "Driver is in status DELIVERING but there is no current delivery set."));
    // Clean up the state
    ctx.clear(ASSIGNED_DELIVERY);

    // Notify the delivery service that the delivery was delivered
    new OrderWorkflowRestateClient(ctx, assignedDelivery.getOrderId())
            .oneWay()
            .notifyDeliveryDelivered();

    // Update the status of the driver to idle
    ctx.set(DRIVER_STATUS, DriverStatus.IDLE);
  }

  /** Gets called by the driver's mobile app when he has moved to a new location. */
  @Override
  public void handleDriverLocationUpdateEvent(KeyedContext ctx, KafkaDriverLocationEvent request)
      throws TerminalException {
    // Update the location of the driver
    Location location = JacksonSerdes.of(Location.class).deserialize(request.getLocation());
    ctx.set(DRIVER_LOCATION, location);

    // Update the location of the delivery, if there is one
    ctx.get(ASSIGNED_DELIVERY)
        .ifPresent(
            delivery ->
                    new OrderWorkflowRestateClient(ctx, delivery.getOrderId())
                            .oneWay()
                            .handleDriverLocationUpdate(location));
  }

  /**
   * Returns Empty if no delivery was assigned, or the delivery information if a delivery was
   * assigned. Gets polled by the driver's mobile app at regular intervals to check if a delivery
   * got assigned to him.
   */
  @Override
  public AssignedDeliveryResponse getAssignedDelivery(KeyedContext ctx, DriverId request)
      throws TerminalException {
    var assignedDelivery = ctx.get(ASSIGNED_DELIVERY);

    return assignedDelivery
        .map(
            delivery ->
                AssignedDeliveryResponse.newBuilder()
                    .setDelivery(
                        Delivery.newBuilder()
                            .setDriverId(delivery.getDriverId())
                            .setOrderId(delivery.getOrderId())
                            .setRestaurantId(delivery.getRestaurantId())
                            .setCustomerLocation(delivery.getCustomerLocation().toProto())
                            .setRestaurantLocation(delivery.getRestaurantLocation().toProto())
                            .build())
                    .build())
        .orElse(AssignedDeliveryResponse.newBuilder().setEmpty(Empty.getDefaultInstance()).build());
  }

  // Utility function to check if the driver is in the expected state
  // If the driver is in a different state, a terminal exception is thrown that stops any retries
  // from taking place.
  // Is only called from inside the driver service.
  private void expectStatus(KeyedContext ctx, DriverStatus expectedStatus) {
    var currentStatus = ctx.get(DRIVER_STATUS).orElse(DriverStatus.IDLE);

    if (currentStatus != expectedStatus) {
      throw new TerminalException(
          String.format(
              "Driver status wrong. Expected %s but was %s",
              expectedStatus.toString(), currentStatus));
    }
  }
}
