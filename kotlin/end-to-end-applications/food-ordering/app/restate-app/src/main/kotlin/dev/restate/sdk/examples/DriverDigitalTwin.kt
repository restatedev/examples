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
package dev.restate.sdk.examples

import dev.restate.sdk.annotation.Handler
import dev.restate.sdk.annotation.Shared
import dev.restate.sdk.annotation.VirtualObject
import dev.restate.sdk.common.TerminalException
import dev.restate.sdk.kotlin.*

/**
 * Digital twin for the driver. Represents a driver and his status, assigned delivery, and location.
 * Keyed by driver ID. The actual driver would have an application (mocked by
 * DriverMobileAppSimulator ) that calls this service.
 */
@VirtualObject
class DriverDigitalTwin {
  companion object {
    // Current status of the driver: idle, waiting for work, or delivering
    private val DRIVER_STATUS = stateKey<DriverStatus>("driver-status")

    // Only set if the driver is currently doing a delivery
    private val ASSIGNED_DELIVERY = stateKey<AssignedDelivery>("assigned-delivery")

    // Current location of the driver
    private val DRIVER_LOCATION = stateKey<Location>("driver-location")
  }

  /**
   * When the driver starts his work day or finishes a delivery, his application
   * (DriverMobileAppSimulator) calls this method.
   */
  @Handler
  suspend fun setDriverAvailable(region: String) {
    expectStatus(DriverStatus.IDLE)

    val driverId = objectKey()
    state().set(DRIVER_STATUS, DriverStatus.WAITING_FOR_WORK)
    toVirtualObject<DriverDeliveryMatcher>(region).request { setDriverAvailable(driverId) }.send()
  }

  /**
   * Gets called by the delivery manager when this driver was assigned to do the delivery. Updates
   * the status of the digital driver twin, and notifies the delivery service of its current
   * location.
   */
  @Handler
  suspend fun assignDeliveryJob(request: AssignDeliveryRequest) {
    expectStatus(DriverStatus.WAITING_FOR_WORK)

    // Update the status and assigned delivery information of the driver
    val state = state()
    state.set(DRIVER_STATUS, DriverStatus.DELIVERING)
    state.set(
        ASSIGNED_DELIVERY,
        AssignedDelivery(
            objectKey(),
            request.orderId,
            request.restaurantId,
            request.restaurantLocation,
            request.customerLocation))

    // Initialize the ETA service
    toVirtualObject<OrderETAService>(request.orderId)
        .request {
          notifyDeliveryLocations(
              DeliveryLocations(request.restaurantLocation, request.customerLocation))
        }
        .send()

    // Notify current location to the delivery service
    state.get(DRIVER_LOCATION)?.let { location ->
      toVirtualObject<OrderETAService>(request.orderId)
          .request { notifyDriverLocationUpdate(location) }
          .send()
    }
  }

  /**
   * Gets called by the driver's mobile app when he has picked up the delivery from the restaurant.
   */
  @Handler
  suspend fun notifyDeliveryPickup() {
    expectStatus(DriverStatus.DELIVERING)

    // Retrieve the ongoing delivery and update its status
    val state = state()
    val currentDelivery =
        state.get(ASSIGNED_DELIVERY)
            ?: throw TerminalException(
                "Driver is in status DELIVERING but there is no current delivery set.")
    currentDelivery.notifyPickup()
    state.set(ASSIGNED_DELIVERY, currentDelivery)

    // Update the status of the delivery in the delivery manager
    toVirtualObject<OrderWorkflow>(currentDelivery.orderId)
        .request { notifyDeliveryPickup() }
        .send()
    toVirtualObject<OrderETAService>(currentDelivery.orderId)
        .request { notifyDeliveryPickup() }
        .send()
  }

  /** Gets called by the driver's mobile app when he has delivered the order to the customer. */
  @Handler
  suspend fun notifyDeliveryDelivered() {
    expectStatus(DriverStatus.DELIVERING)

    // Retrieve the ongoing delivery
    val state = state()
    val assignedDelivery =
        state.get(ASSIGNED_DELIVERY)
            ?: throw TerminalException(
                "Driver is in status DELIVERING but there is no current delivery set.")
    // Clean up the state
    state.clear(ASSIGNED_DELIVERY)

    // Notify the delivery service that the delivery was delivered
    toVirtualObject<OrderWorkflow>(assignedDelivery.orderId)
        .request { notifyDeliveryDelivered() }
        .send()

    // Update the status of the driver to idle
    state.set(DRIVER_STATUS, DriverStatus.IDLE)
  }

  /** Gets called by the driver's mobile app when he has moved to a new location. */
  @Handler
  suspend fun handleDriverLocationUpdateEvent(location: Location) {
    // Update the location of the driver
    val state = state()
    state.set(DRIVER_LOCATION, location)

    // Update the location of the delivery, if there is one
    state.get(ASSIGNED_DELIVERY)?.let { delivery ->
      toVirtualObject<OrderETAService>(delivery.orderId)
          .request { notifyDriverLocationUpdate(location) }
          .send()
    }
  }

  /**
   * Returns Empty if no delivery was assigned, or the delivery information if a delivery was
   * assigned. Gets polled by the driver's mobile app at regular intervals to check if a delivery
   * got assigned to him.
   */
  @Shared
  suspend fun getAssignedDelivery(): GetAssignedDeliveryResult {
    return GetAssignedDeliveryResult(state().get(ASSIGNED_DELIVERY))
  }

  // Utility function to check if the driver is in the expected state
  // If the driver is in a different state, a terminal exception is thrown that stops any retries
  // from taking place.
  // Is only called from inside the driver service.
  private suspend fun expectStatus(expectedStatus: DriverStatus) {
    val currentStatus = state().get(DRIVER_STATUS) ?: DriverStatus.IDLE

    if (currentStatus != expectedStatus) {
      throw TerminalException(
          "Driver status wrong. Expected $expectedStatus but was $currentStatus")
    }
  }
}
