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

import static dev.restate.sdk.examples.generated.OrderProto.*;
import static dev.restate.sdk.examples.utils.TypeUtils.statusToProto;

import dev.restate.sdk.RestateContext;
import dev.restate.sdk.common.CoreSerdes;
import dev.restate.sdk.common.Serde;
import dev.restate.sdk.common.StateKey;
import dev.restate.sdk.common.TerminalException;
import dev.restate.sdk.examples.generated.DeliveryManagerRestate;
import dev.restate.sdk.examples.generated.DriverDeliveryMatcherRestate;
import dev.restate.sdk.examples.generated.DriverDigitalTwinRestate;
import dev.restate.sdk.examples.generated.OrderStatusServiceRestate;
import dev.restate.sdk.examples.types.DeliveryInformation;
import dev.restate.sdk.examples.types.Location;
import dev.restate.sdk.examples.types.StatusEnum;
import dev.restate.sdk.examples.utils.GeoUtils;
import dev.restate.sdk.serde.jackson.JacksonSerdes;

/**
 * Manages the delivery of the order to the customer. Keyed by the order ID (similar to the
 * OrderService and OrderStatusService).
 */
public class DeliveryManager extends DeliveryManagerRestate.DeliveryManagerRestateImplBase {

  // State key to store all relevant information about the delivery.
  private static final StateKey<DeliveryInformation> DELIVERY_INFO =
      StateKey.of("delivery-info", JacksonSerdes.of(DeliveryInformation.class));

  private static final Serde<Location> locationSerde = JacksonSerdes.of(Location.class);

  /**
   * Finds a driver, assigns the delivery job to the driver, and updates the status of the order.
   * Gets called by the OrderService when a new order has been prepared and needs to be delivered.
   */
  @Override
  public void start(RestateContext ctx, DeliveryRequest request) throws TerminalException {

    // Temporary placeholder: random location
    var restaurantLocation = ctx.sideEffect(locationSerde, () -> GeoUtils.randomLocation());
    var customerLocation = ctx.sideEffect(locationSerde, () -> GeoUtils.randomLocation());

    // Store the delivery information in Restate's state store
    DeliveryInformation deliveryInfo =
        new DeliveryInformation(
            request.getOrderId(),
            request.getCallback(),
            request.getRestaurantId(),
            restaurantLocation,
            customerLocation,
            false);
    ctx.set(DELIVERY_INFO, deliveryInfo);

    // Acquire a driver
    var driverAwakeable = ctx.awakeable(CoreSerdes.STRING_UTF8);
    DriverDeliveryMatcherRestate.newClient(ctx)
        .oneWay()
        .requestDriverForDelivery(
            DeliveryCallback.newBuilder()
                .setRegion(GeoUtils.DEMO_REGION)
                .setDeliveryCallbackId(driverAwakeable.id())
                .build());
    // Wait until the driver pool service has located a driver
    // This awakeable gets resolved either immediately when there is a pending delivery
    // or later, when a new delivery comes in.
    var driverId = driverAwakeable.await();

    // Assign the driver to the job
    DriverDigitalTwinRestate.newClient(ctx)
        .assignDeliveryJob(
            AssignDeliveryRequest.newBuilder()
                .setDriverId(driverId)
                .setOrderId(request.getOrderId())
                .setRestaurantId(request.getRestaurantId())
                .setRestaurantLocation(restaurantLocation.toProto())
                .setCustomerLocation(customerLocation.toProto())
                .build())
        .await();

    // Update the status of the order to "waiting for the driver"
    OrderStatusServiceRestate.newClient(ctx)
        .oneWay()
        .setStatus(statusToProto(request.getOrderId(), StatusEnum.WAITING_FOR_DRIVER));
  }

  /**
   * Notifies that the delivery was picked up. Gets called by the DriverService.NotifyDeliveryPickup
   * when the driver has arrived at the restaurant.
   */
  @Override
  public void notifyDeliveryPickup(RestateContext ctx, OrderId request) throws TerminalException {
    // Retrieve the delivery information for this delivery
    var delivery =
        ctx.get(DELIVERY_INFO)
            .orElseThrow(
                () ->
                    new TerminalException(
                        "Delivery was picked up but there is no ongoing delivery."));
    // Update the status of the delivery to "picked up"
    delivery.notifyPickup();
    ctx.set(DELIVERY_INFO, delivery);

    // Update the status of the order to "in delivery"
    OrderStatusServiceRestate.newClient(ctx)
        .oneWay()
        .setStatus(statusToProto(delivery.getOrderId(), StatusEnum.IN_DELIVERY));
  }

  /**
   * Notifies that the order was delivered. Gets called by the DriverService.NotifyDeliveryDelivered
   * when the driver has delivered the order to the customer.
   */
  @Override
  public void notifyDeliveryDelivered(RestateContext ctx, OrderId request)
      throws TerminalException {
    // Retrieve the delivery information for this delivery
    var delivery =
        ctx.get(DELIVERY_INFO)
            .orElseThrow(
                () ->
                    new TerminalException(
                        "Delivery was delivered but there is no ongoing delivery."));
    // Order has been delivered, so state can be cleared
    ctx.clear(DELIVERY_INFO);

    // Notify the OrderService that the delivery has been completed
    ctx.awakeableHandle(delivery.getCallbackId()).resolve(CoreSerdes.VOID, null);
  }

  /**
   * Updates the location of the order. Gets called by
   * DriverService.HandleDriverLocationUpdateEvent() (digital twin of the driver) when the driver
   * has moved to a new location.
   */
  @Override
  public void handleDriverLocationUpdate(RestateContext ctx, DeliveryLocationUpdate request)
      throws TerminalException {
    // Retrieve the delivery information for this delivery
    var delivery =
        ctx.get(DELIVERY_INFO)
            .orElseThrow(
                () ->
                    new TerminalException(
                        "Driver is doing a delivery but there is no ongoing delivery."));

    // Parse the new location, and calculate the ETA of the delivery to the customer
    var location = Location.fromProto(request.getLocation());
    var eta =
        delivery.isOrderPickedUp()
            ? GeoUtils.calculateEtaMillis(location, delivery.getCustomerLocation())
            : GeoUtils.calculateEtaMillis(location, delivery.getRestaurantLocation())
                + GeoUtils.calculateEtaMillis(
                    delivery.getRestaurantLocation(), delivery.getCustomerLocation());

    // Update the ETA of the order
    OrderStatusServiceRestate.newClient(ctx)
        .oneWay()
        .setETA(OrderStatus.newBuilder().setOrderId(delivery.getOrderId()).setEta(eta).build());
  }
}
