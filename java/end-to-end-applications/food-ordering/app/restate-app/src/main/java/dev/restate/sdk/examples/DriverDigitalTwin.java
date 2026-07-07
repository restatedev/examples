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
import dev.restate.sdk.examples.types.AssignDeliveryRequest;
import dev.restate.sdk.examples.types.AssignedDelivery;
import dev.restate.sdk.examples.types.DriverStatus;
import dev.restate.sdk.examples.types.Location;
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
  public void setDriverAvailable(String region) throws TerminalException {
    expectStatus(DriverStatus.IDLE);

    Restate.state().set(DRIVER_STATUS, DriverStatus.WAITING_FOR_WORK);
    Restate.virtualObjectHandle(DriverDeliveryMatcher.class, region)
        .send(DriverDeliveryMatcher::setDriverAvailable, Restate.key());
  }

  /**
   * Gets called by the delivery manager when this driver was assigned to do the delivery. Updates
   * the status of the digital driver twin, and notifies the delivery service of its current
   * location.
   */
  @Handler
  public void assignDeliveryJob(AssignDeliveryRequest request) throws TerminalException {
    expectStatus(DriverStatus.WAITING_FOR_WORK);

    var state = Restate.state();
    // Update the status and assigned delivery information of the driver
    state.set(DRIVER_STATUS, DriverStatus.DELIVERING);
    state.set(
        ASSIGNED_DELIVERY,
        new AssignedDelivery(
            Restate.key(),
            request.getOrderId(),
            request.getRestaurantId(),
            request.getRestaurantLocation(),
            request.getCustomerLocation()));

    // Notify current location to the delivery service
    state
        .get(DRIVER_LOCATION)
        .ifPresent(
            loc ->
                Restate.virtualObjectHandle(DeliveryManager.class, request.getOrderId())
                    .send(DeliveryManager::handleDriverLocationUpdate, loc));
  }

  /**
   * Gets called by the driver's mobile app when he has picked up the delivery from the restaurant.
   */
  @Handler
  public void notifyDeliveryPickup() throws TerminalException {
    expectStatus(DriverStatus.DELIVERING);

    var state = Restate.state();
    // Retrieve the ongoing delivery and update its status
    var currentDelivery =
        state
            .get(ASSIGNED_DELIVERY)
            .orElseThrow(
                () ->
                    new TerminalException(
                        "Driver is in status DELIVERING but there is no current delivery set."));
    currentDelivery.notifyPickup();
    state.set(ASSIGNED_DELIVERY, currentDelivery);

    // Update the status of the delivery in the delivery manager
    Restate.virtualObjectHandle(DeliveryManager.class, currentDelivery.getOrderId())
        .send(DeliveryManager::notifyDeliveryPickup);
  }

  /** Gets called by the driver's mobile app when he has delivered the order to the customer. */
  @Handler
  public void notifyDeliveryDelivered() throws TerminalException {
    expectStatus(DriverStatus.DELIVERING);

    var state = Restate.state();
    // Retrieve the ongoing delivery
    var assignedDelivery =
        state
            .get(ASSIGNED_DELIVERY)
            .orElseThrow(
                () ->
                    new TerminalException(
                        "Driver is in status DELIVERING but there is no current delivery set."));
    // Clean up the state
    state.clear(ASSIGNED_DELIVERY);

    // Notify the delivery service that the delivery was delivered
    Restate.virtualObjectHandle(DeliveryManager.class, assignedDelivery.getOrderId())
        .send(DeliveryManager::notifyDeliveryDelivered);

    // Update the status of the driver to idle
    state.set(DRIVER_STATUS, DriverStatus.IDLE);
  }

  /** Gets called by the driver's mobile app when he has moved to a new location. */
  @Handler
  public void handleDriverLocationUpdateEvent(Location location) {
    // Update the location of the driver
    Restate.state().set(DRIVER_LOCATION, location);

    // Update the location of the delivery, if there is one
    Optional<AssignedDelivery> assignedDelivery = Restate.state().get(ASSIGNED_DELIVERY);
    if (assignedDelivery.isPresent()) {
      Restate.virtualObjectHandle(DeliveryManager.class, assignedDelivery.get().getOrderId())
          .send(DeliveryManager::handleDriverLocationUpdate, location);
    }
  }

  /**
   * Returns Empty if no delivery was assigned, or the delivery information if a delivery was
   * assigned. Gets polled by the driver's mobile app at regular intervals to check if a delivery
   * got assigned to him.
   */
  @Handler
  public Optional<AssignedDelivery> getAssignedDelivery() {
    return Restate.state().get(ASSIGNED_DELIVERY);
  }

  // Utility function to check if the driver is in the expected state
  // If the driver is in a different state, a terminal exception is thrown that stops any retries
  // from taking place.
  // Is only called from inside the driver service.
  private void expectStatus(DriverStatus expectedStatus) {
    var currentStatus = Restate.state().get(DRIVER_STATUS).orElse(DriverStatus.IDLE);

    if (currentStatus != expectedStatus) {
      throw new TerminalException(
          String.format(
              "Driver status wrong. Expected %s but was %s",
              expectedStatus.toString(), currentStatus));
    }
  }
}
