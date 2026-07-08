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
package dev.restate.sdk.examples.external

import dev.restate.sdk.annotation.Handler
import dev.restate.sdk.annotation.VirtualObject
import dev.restate.sdk.common.TerminalException
import dev.restate.sdk.examples.AssignedDelivery
import dev.restate.sdk.examples.DriverDigitalTwin
import dev.restate.sdk.examples.Location
import dev.restate.sdk.examples.clients.KafkaPublisher
import dev.restate.sdk.examples.utils.GeoUtils
import dev.restate.sdk.kotlin.*
import kotlin.time.Duration.Companion.milliseconds
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json
import org.apache.logging.log4j.LogManager
import org.apache.logging.log4j.Logger

/**
 * !!!SHOULD BE AN EXTERNAL APP ON THE DRIVER's PHONE!!! Simulated driver with application that
 * interacts with the food ordering app. This is not really part of the food ordering application.
 * This would actually be a mobile app that drivers use to accept delivery requests, and to set
 * themselves as available.
 *
 * For simplicity, we implemented this with Restate.
 */
@VirtualObject
class DriverMobileAppSimulator {
  companion object {
    private val CURRENT_LOCATION = stateKey<Location>("current-location")
    private val ASSIGNED_DELIVERY = stateKey<AssignedDelivery>("assigned-delivery")

    private val logger: Logger = LogManager.getLogger(DriverMobileAppSimulator::class.java)

    private const val POLL_INTERVAL: Long = 1000
    private const val MOVE_INTERVAL: Long = 1000
    private const val PAUSE_BETWEEN_DELIVERIES: Long = 2000
  }

  /** Mimics the driver setting himself to available in the app */
  @Handler
  suspend fun startDriver() {
    val state = state()
    // If this driver was already created, do nothing
    if (state.get(CURRENT_LOCATION) != null) {
      return
    }

    val driverId = objectKey()
    logger.info("Starting driver " + driverId)
    val location = runBlock { GeoUtils.randomLocation() }
    state.set(CURRENT_LOCATION, location)
    KafkaPublisher.sendDriverUpdate(driverId, Json.encodeToString(location).encodeToByteArray())

    // Tell the digital twin of the driver in the food ordering app, that he is available
    virtualObject<DriverDigitalTwin>(driverId).setDriverAvailable(GeoUtils.DEMO_REGION)

    // Start polling for work
    toVirtualObject<DriverMobileAppSimulator>(driverId).request { pollForWork() }.send()
  }

  /**
   * Asks the food ordering app to get a new delivery job. If there is no job, the driver will ask
   * again after a short delay.
   */
  @Handler
  suspend fun pollForWork() {
    val driverId = objectKey()

    // Ask the digital twin of the driver in the food ordering app, if he already got a job assigned
    val getAssignedDeliveryResult = virtualObject<DriverDigitalTwin>(driverId).getAssignedDelivery()

    // If there is no job, ask again after a short delay
    if (getAssignedDeliveryResult.assignedDelivery == null) {
      toVirtualObject<DriverMobileAppSimulator>(driverId)
          .request { pollForWork() }
          .send(POLL_INTERVAL.milliseconds)
      return
    }

    // If there is a job, start the delivery
    val newAssignedDelivery =
        AssignedDelivery(
            getAssignedDeliveryResult.assignedDelivery.driverId,
            getAssignedDeliveryResult.assignedDelivery.orderId,
            getAssignedDeliveryResult.assignedDelivery.restaurantId,
            getAssignedDeliveryResult.assignedDelivery.restaurantLocation,
            getAssignedDeliveryResult.assignedDelivery.customerLocation,
        )
    state().set(ASSIGNED_DELIVERY, newAssignedDelivery)

    // Start moving to the delivery pickup location
    toVirtualObject<DriverMobileAppSimulator>(driverId)
        .request { move() }
        .send(MOVE_INTERVAL.milliseconds)
  }

  /** Periodically lets the food ordering app know the new location */
  @Handler
  suspend fun move() {
    val driverId = objectKey()
    val state = state()
    val assignedDelivery =
        state.get(ASSIGNED_DELIVERY) ?: throw TerminalException("Driver has no delivery assigned")
    val currentLocation =
        state.get(CURRENT_LOCATION) ?: throw TerminalException("Driver has no location assigned")

    // Get next destination to go to
    val nextDestination =
        if (assignedDelivery.isOrderPickedUp) assignedDelivery.customerLocation
        else assignedDelivery.restaurantLocation

    // Move to the next location
    val newLocation: Location = GeoUtils.moveToDestination(currentLocation, nextDestination)
    state.set(CURRENT_LOCATION, newLocation)
    KafkaPublisher.sendDriverUpdate(driverId, Json.encodeToString(newLocation).encodeToByteArray())

    // If we reached the destination, notify the food ordering app
    if (newLocation.equals(nextDestination)) {
      // If the delivery was already picked up, then that means it now arrived at the customer
      if (assignedDelivery.isOrderPickedUp) {
        // Delivery is delivered to customer
        state.clear(ASSIGNED_DELIVERY)

        // Notify the driver's digital twin in the food ordering app of the delivery success
        virtualObject<DriverDigitalTwin>(driverId).notifyDeliveryDelivered()

        // Take a small break before starting the next delivery
        sleep(PAUSE_BETWEEN_DELIVERIES.milliseconds)

        // Tell the driver's digital twin in the food ordering app, that he is available
        toVirtualObject<DriverDigitalTwin>(driverId)
            .request { setDriverAvailable(GeoUtils.DEMO_REGION) }
            .send()

        // Start polling for work
        toVirtualObject<DriverMobileAppSimulator>(driverId).request { pollForWork() }.send()
        return
      }

      // If the delivery was not picked up yet, then that means the driver now arrived at the
      // restaurant
      // and will start the delivery
      assignedDelivery.notifyPickup()
      state.set(ASSIGNED_DELIVERY, assignedDelivery)
      virtualObject<DriverDigitalTwin>(driverId).notifyDeliveryPickup()
    }

    // Call this method again after a short delay
    toVirtualObject<DriverMobileAppSimulator>(driverId)
        .request { move() }
        .send(MOVE_INTERVAL.milliseconds)
  }
}
