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
import dev.restate.sdk.examples.utils.GeoUtils
import dev.restate.sdk.kotlin.*

/** Virtual object tracking the ETA, keyed by order-id */
@VirtualObject
class OrderETAService {
  companion object {
    private val ORDER_ETA = stateKey<Long>("order-eta")
    private val DELIVERY_LOCATIONS = stateKey<DeliveryLocations>("delivery-locations")
    private val DELIVERY_IS_PICKED_UP = stateKey<Unit>("order-is-picked-up")
  }

  /** Gets called by the webUI frontend to display the status of an order. */
  @Shared
  suspend fun get(): Long {
    return state().get(ORDER_ETA) ?: -1L
  }

  @Handler
  suspend fun notifyDeliveryLocations(locations: DeliveryLocations) {
    state().set(DELIVERY_LOCATIONS, locations)
  }

  /**
   * Updates the location of the order. Gets called by
   * DriverService.HandleDriverLocationUpdateEvent() (digital twin of the driver) when the driver
   * has moved to a new location.
   */
  @Handler
  suspend fun notifyDeliveryPickup() {
    state().set(DELIVERY_IS_PICKED_UP, Unit)
  }

  /**
   * Updates the location of the order. Gets called by
   * DriverService.HandleDriverLocationUpdateEvent() (digital twin of the driver) when the driver
   * has moved to a new location.
   */
  @Handler
  suspend fun notifyDriverLocationUpdate(newLocation: Location) {
    val state = state()
    // Retrieve the delivery information for this delivery
    val locations =
        state.get(DELIVERY_LOCATIONS)
            ?: throw TerminalException(
                "Driver is doing a delivery but there is no ongoing delivery.")

    val isOrderPickedUp = state.get(DELIVERY_IS_PICKED_UP) != null

    // Parse the new location, and calculate the ETA of the delivery to the customer
    val eta =
        if (isOrderPickedUp) GeoUtils.calculateEtaMillis(newLocation, locations.customer)
        else
            (GeoUtils.calculateEtaMillis(newLocation, locations.restaurant) +
                GeoUtils.calculateEtaMillis(locations.restaurant, locations.customer))

    // Update the ETA of the order
    state.set(ORDER_ETA, eta)
  }
}
