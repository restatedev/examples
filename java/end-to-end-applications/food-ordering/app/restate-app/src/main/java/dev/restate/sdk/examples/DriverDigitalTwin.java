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

package dev.restate.sdk.examples;

import dev.restate.sdk.ObjectContext;
import dev.restate.sdk.annotation.Handler;
import dev.restate.sdk.annotation.VirtualObject;
import dev.restate.sdk.examples.types.AssignDeliveryRequest;
import dev.restate.sdk.examples.types.AssignedDelivery;
import dev.restate.sdk.examples.types.DriverStatus;
import dev.restate.sdk.examples.types.Location;
import dev.restate.sdk.common.StateKey;
import dev.restate.sdk.common.TerminalException;

import java.util.Optional;

/**
 * Digital twin for the driver. Represents a driver and his status, assigned delivery, and location.
 * Keyed by driver ID. The actual driver would have an application (mocked by
 * DriverMobileAppSimulator ) that calls this service.
 */
@VirtualObject
public class DriverDigitalTwin {

  // Current status of the driver: idle, waiting for work, or delivering
  private static final StateKey<DriverStatus> DRIVER_STATUS =
      StateKey.of("driver-status", DriverStatus.class);

  // Only set if the driver is currently doing a delivery
  private static final StateKey<AssignedDelivery> ASSIGNED_DELIVERY =
      StateKey.of("assigned-delivery", AssignedDelivery.class);

  // Current location of the driver
  private static final StateKey<Location> DRIVER_LOCATION =
      StateKey.of("driver-location", Location.class);

  /**
   * When the driver starts his work day or finishes a delivery, his application
   * (DriverMobileAppSimulator) calls this method.
   */
  @Handler
  public void setDriverAvailable(ObjectContext ctx, String region) throws TerminalException {
    expectStatus(ctx, DriverStatus.IDLE);

    ctx.set(DRIVER_STATUS, DriverStatus.WAITING_FOR_WORK);
    DriverDeliveryMatcherClient.fromContext(ctx, region).send().setDriverAvailable(ctx.key());
  }

  /**
   * Gets called by the delivery manager when this driver was assigned to do the delivery. Updates
   * the status of the digital driver twin, and notifies the delivery service of its current
   * location.
   */
  @Handler
  public void assignDeliveryJob(ObjectContext ctx, AssignDeliveryRequest request)
      throws TerminalException {
    expectStatus(ctx, DriverStatus.WAITING_FOR_WORK);

    // Update the status and assigned delivery information of the driver
    ctx.set(DRIVER_STATUS, DriverStatus.DELIVERING);
    ctx.set(
        ASSIGNED_DELIVERY,
        new AssignedDelivery(
            ctx.key(),
            request.getOrderId(),
            request.getRestaurantId(),
            request.getRestaurantLocation(),
            request.getCustomerLocation()));

    // Notify current location to the delivery service
    ctx.get(DRIVER_LOCATION)
        .ifPresent(
            loc ->
                DeliveryManagerClient.fromContext(ctx, request.getOrderId())
                    .send()
                    .handleDriverLocationUpdate(loc));
  }

  /**
   * Gets called by the driver's mobile app when he has picked up the delivery from the restaurant.
   */
  @Handler
  public void notifyDeliveryPickup(ObjectContext ctx) throws TerminalException {
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
    DeliveryManagerClient.fromContext(ctx, currentDelivery.getOrderId())
        .send()
        .notifyDeliveryPickup();
  }

  /** Gets called by the driver's mobile app when he has delivered the order to the customer. */
  @Handler
  public void notifyDeliveryDelivered(ObjectContext ctx) throws TerminalException {
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
    DeliveryManagerClient.fromContext(ctx, assignedDelivery.getOrderId())
        .send()
        .notifyDeliveryDelivered();

    // Update the status of the driver to idle
    ctx.set(DRIVER_STATUS, DriverStatus.IDLE);
  }

  /** Gets called by the driver's mobile app when he has moved to a new location. */
  @Handler
  public void handleDriverLocationUpdateEvent(ObjectContext ctx, Location location) {
    // Update the location of the driver
    ctx.set(DRIVER_LOCATION, location);

    // Update the location of the delivery, if there is one
    Optional<AssignedDelivery> assignedDelivery = ctx.get(ASSIGNED_DELIVERY);
    if (assignedDelivery.isPresent()) {
      DeliveryManagerClient.fromContext(ctx, assignedDelivery.get().getOrderId())
          .send()
          .handleDriverLocationUpdate(location);
    }
  }

  /**
   * Returns Empty if no delivery was assigned, or the delivery information if a delivery was
   * assigned. Gets polled by the driver's mobile app at regular intervals to check if a delivery
   * got assigned to him.
   */
  @Handler
  public Optional<AssignedDelivery> getAssignedDelivery(ObjectContext ctx) {
    return ctx.get(ASSIGNED_DELIVERY);
  }

  // Utility function to check if the driver is in the expected state
  // If the driver is in a different state, a terminal exception is thrown that stops any retries
  // from taking place.
  // Is only called from inside the driver service.
  private void expectStatus(ObjectContext ctx, DriverStatus expectedStatus) {
    var currentStatus = ctx.get(DRIVER_STATUS).orElse(DriverStatus.IDLE);

    if (currentStatus != expectedStatus) {
      throw new TerminalException(
          String.format(
              "Driver status wrong. Expected %s but was %s",
              expectedStatus.toString(), currentStatus));
    }
  }
}
