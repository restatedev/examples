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

import dev.restate.sdk.Restate;
import dev.restate.sdk.annotation.Handler;
import dev.restate.sdk.annotation.VirtualObject;
import dev.restate.sdk.common.StateKey;
import dev.restate.sdk.common.TerminalException;
import dev.restate.sdk.examples.types.*;
import dev.restate.sdk.examples.utils.GeoUtils;

/**
 * Manages the delivery of the order to the customer. Keyed by the order ID (similar to the
 * OrderService and OrderStatusService).
 */
@VirtualObject
public class DeliveryManager {

  // State key to store all relevant information about the delivery.
  private static final StateKey<DeliveryInformation> DELIVERY_INFO =
      StateKey.of("delivery-info", DeliveryInformation.class);

  /**
   * Finds a driver, assigns the delivery job to the driver, and updates the status of the order.
   * Gets called by the OrderService when a new order has been prepared and needs to be delivered.
   */
  @Handler
  public void start(DeliveryRequest request) throws TerminalException {
    String orderId = Restate.key();

    // Temporary placeholder: random location
    var restaurantLocation =
        Restate.run("restaurant location", Location.class, GeoUtils::randomLocation);
    var customerLocation =
        Restate.run("customer location", Location.class, GeoUtils::randomLocation);

    // Store the delivery information in Restate's state store
    DeliveryInformation deliveryInfo =
        new DeliveryInformation(
            orderId,
            request.getCallback(),
            request.getRestaurantId(),
            restaurantLocation,
            customerLocation,
            false);
    Restate.state().set(DELIVERY_INFO, deliveryInfo);

    // Acquire a driver
    var driverAwakeable = Restate.awakeable(String.class);
    Restate.virtualObjectHandle(DriverDeliveryMatcher.class, GeoUtils.DEMO_REGION)
        .send(DriverDeliveryMatcher::requestDriverForDelivery, driverAwakeable.id());
    // Wait until the driver pool service has located a driver
    // This awakeable gets resolved either immediately when there is a pending delivery
    // or later, when a new delivery comes in.
    var driverId = driverAwakeable.await();

    // Assign the driver to the job
    Restate.virtualObject(DriverDigitalTwin.class, driverId)
        .assignDeliveryJob(
            new AssignDeliveryRequest(
                orderId, request.getRestaurantId(), restaurantLocation, customerLocation));

    // Update the status of the order to "waiting for the driver"
    Restate.virtualObjectHandle(OrderStatusService.class, orderId)
        .send(OrderStatusService::setStatus, StatusEnum.WAITING_FOR_DRIVER);
  }

  /**
   * Notifies that the delivery was picked up. Gets called by the DriverService.NotifyDeliveryPickup
   * when the driver has arrived at the restaurant.
   */
  @Handler
  public void notifyDeliveryPickup() throws TerminalException {
    var state = Restate.state();
    // Retrieve the delivery information for this delivery
    var delivery =
        state
            .get(DELIVERY_INFO)
            .orElseThrow(
                () ->
                    new TerminalException(
                        "Delivery was picked up but there is no ongoing delivery."));
    // Update the status of the delivery to "picked up"
    delivery.notifyPickup();
    state.set(DELIVERY_INFO, delivery);

    // Update the status of the order to "in delivery"
    Restate.virtualObjectHandle(OrderStatusService.class, Restate.key())
        .send(OrderStatusService::setStatus, StatusEnum.IN_DELIVERY);
  }

  /**
   * Notifies that the order was delivered. Gets called by the DriverService.NotifyDeliveryDelivered
   * when the driver has delivered the order to the customer.
   */
  @Handler
  public void notifyDeliveryDelivered() throws TerminalException {
    var state = Restate.state();
    // Retrieve the delivery information for this delivery
    var delivery =
        state
            .get(DELIVERY_INFO)
            .orElseThrow(
                () ->
                    new TerminalException(
                        "Delivery was delivered but there is no ongoing delivery."));
    // Order has been delivered, so state can be cleared
    state.clear(DELIVERY_INFO);

    // Notify the OrderService that the delivery has been completed
    Restate.awakeableHandle(delivery.getCallbackId()).resolve(Void.class, null);
  }

  /**
   * Updates the location of the order. Gets called by
   * DriverService.HandleDriverLocationUpdateEvent() (digital twin of the driver) when the driver
   * has moved to a new location.
   */
  @Handler
  public void handleDriverLocationUpdate(Location newLocation) throws TerminalException {
    // Retrieve the delivery information for this delivery
    var delivery =
        Restate.state()
            .get(DELIVERY_INFO)
            .orElseThrow(
                () ->
                    new TerminalException(
                        "Driver is doing a delivery but there is no ongoing delivery."));

    // Parse the new location, and calculate the ETA of the delivery to the customer
    var eta =
        delivery.isOrderPickedUp()
            ? GeoUtils.calculateEtaMillis(newLocation, delivery.getCustomerLocation())
            : GeoUtils.calculateEtaMillis(newLocation, delivery.getRestaurantLocation())
                + GeoUtils.calculateEtaMillis(
                    delivery.getRestaurantLocation(), delivery.getCustomerLocation());

    // Update the ETA of the order
    Restate.virtualObjectHandle(OrderStatusService.class, Restate.key())
        .send(OrderStatusService::setETA, eta);
  }
}
