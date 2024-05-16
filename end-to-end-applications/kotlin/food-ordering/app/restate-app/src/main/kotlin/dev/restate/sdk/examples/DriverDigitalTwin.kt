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
import dev.restate.sdk.annotation.VirtualObject
import dev.restate.sdk.common.TerminalException
import dev.restate.sdk.kotlin.KtStateKey
import dev.restate.sdk.kotlin.ObjectContext

/**
 * Digital twin for the driver. Represents a driver and his status, assigned delivery, and location.
 * Keyed by driver ID. The actual driver would have an application (mocked by
 * DriverMobileAppSimulator ) that calls this service.
 */
@VirtualObject
class DriverDigitalTwin {
  companion object {
    // Current status of the driver: idle, waiting for work, or delivering
    private val DRIVER_STATUS = KtStateKey.json<DriverStatus>("driver-status")

    // Only set if the driver is currently doing a delivery
    private val ASSIGNED_DELIVERY = KtStateKey.json<AssignedDelivery>("assigned-delivery")

    // Current location of the driver
    private val DRIVER_LOCATION = KtStateKey.json<Location>("driver-location")
  }

  /**
   * When the driver starts his work day or finishes a delivery, his application
   * (DriverMobileAppSimulator) calls this method.
   */
  @Handler
  suspend fun setDriverAvailable(ctx: ObjectContext, region: String) {
    expectStatus(ctx, DriverStatus.IDLE)

    ctx.set(DRIVER_STATUS, DriverStatus.WAITING_FOR_WORK)
    DriverDeliveryMatcherClient.fromContext(ctx, region).send().setDriverAvailable(ctx.key())
  }

  /**
   * Gets called by the delivery manager when this driver was assigned to do the delivery. Updates
   * the status of the digital driver twin, and notifies the delivery service of its current
   * location.
   */
  @Handler
  suspend fun assignDeliveryJob(ctx: ObjectContext, request: AssignDeliveryRequest) {
    expectStatus(ctx, DriverStatus.WAITING_FOR_WORK)

    // Update the status and assigned delivery information of the driver
    ctx.set(DRIVER_STATUS, DriverStatus.DELIVERING)
    ctx.set(
        ASSIGNED_DELIVERY,
        AssignedDelivery(
            ctx.key(),
            request.orderId,
            request.restaurantId,
            request.restaurantLocation,
            request.customerLocation))

    // Notify current location to the delivery service
    ctx.get(DRIVER_LOCATION)?.let {
      DeliveryManagerClient.fromContext(ctx, request.orderId).send().handleDriverLocationUpdate(it)
    }
  }

  /**
   * Gets called by the driver's mobile app when he has picked up the delivery from the restaurant.
   */
  @Handler
  suspend fun notifyDeliveryPickup(ctx: ObjectContext) {
    expectStatus(ctx, DriverStatus.DELIVERING)

    // Retrieve the ongoing delivery and update its status
    val currentDelivery =
        ctx.get(ASSIGNED_DELIVERY)
            ?: throw TerminalException(
                "Driver is in status DELIVERING but there is no current delivery set.")
    currentDelivery.notifyPickup()
    ctx.set(ASSIGNED_DELIVERY, currentDelivery)

    // Update the status of the delivery in the delivery manager
    DeliveryManagerClient.fromContext(ctx, currentDelivery.orderId).send().notifyDeliveryPickup()
  }

  /** Gets called by the driver's mobile app when he has delivered the order to the customer. */
  @Handler
  suspend fun notifyDeliveryDelivered(ctx: ObjectContext) {
    expectStatus(ctx, DriverStatus.DELIVERING)

    // Retrieve the ongoing delivery
    val assignedDelivery =
        ctx.get(ASSIGNED_DELIVERY)
            ?: throw TerminalException(
                "Driver is in status DELIVERING but there is no current delivery set.")
    // Clean up the state
    ctx.clear(ASSIGNED_DELIVERY)

    // Notify the delivery service that the delivery was delivered
    DeliveryManagerClient.fromContext(ctx, assignedDelivery.orderId)
        .send()
        .notifyDeliveryDelivered()

    // Update the status of the driver to idle
    ctx.set(DRIVER_STATUS, DriverStatus.IDLE)
  }

  /** Gets called by the driver's mobile app when he has moved to a new location. */
  @Handler
  suspend fun handleDriverLocationUpdateEvent(ctx: ObjectContext, location: Location) {
    // Update the location of the driver
    ctx.set(DRIVER_LOCATION, location)

    // Update the location of the delivery, if there is one
    ctx.get(ASSIGNED_DELIVERY)?.let {
      DeliveryManagerClient.fromContext(ctx, it.orderId).send().handleDriverLocationUpdate(location)
    }
  }

  /**
   * Returns Empty if no delivery was assigned, or the delivery information if a delivery was
   * assigned. Gets polled by the driver's mobile app at regular intervals to check if a delivery
   * got assigned to him.
   */
  @Handler
  suspend fun getAssignedDelivery(ctx: ObjectContext): GetAssignedDeliveryResult {
    return GetAssignedDeliveryResult(ctx.get(ASSIGNED_DELIVERY))
  }

  // Utility function to check if the driver is in the expected state
  // If the driver is in a different state, a terminal exception is thrown that stops any retries
  // from taking place.
  // Is only called from inside the driver service.
  private suspend fun expectStatus(ctx: ObjectContext, expectedStatus: DriverStatus) {
    val currentStatus = ctx.get(DRIVER_STATUS) ?: DriverStatus.IDLE

    if (currentStatus != expectedStatus) {
      throw TerminalException(
          "Driver status wrong. Expected $expectedStatus but was $currentStatus")
    }
  }
}
