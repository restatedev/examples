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
import dev.restate.sdk.kotlin.KtStateKey
import dev.restate.sdk.kotlin.ObjectContext
import dev.restate.sdk.kotlin.resolve

/**
 * Links available drivers to delivery requests Keyed by the region. Each region has a pool of
 * available drivers and orders waiting for a driver. This service is responsible for tracking and
 * matching the two.
 */
@VirtualObject
class DriverDeliveryMatcher {

  companion object {
    // Deliveries that are waiting for a driver to become available
    private val PENDING_DELIVERIES = KtStateKey.json<MutableList<String>>("pending-deliveries")

    // Drivers that are waiting for new delivery requests
    private val AVAILABLE_DRIVERS = KtStateKey.json<MutableList<String>>("available-drivers")
  }

  /**
   * Gets called when a new driver becomes available. Links the driver to the next delivery waiting
   * in line. If no pending deliveries, driver is added to the available driver pool
   */
  @Handler
  suspend fun setDriverAvailable(ctx: ObjectContext, driverId: String) {
    val pendingDeliveries = ctx.get(PENDING_DELIVERIES) ?: mutableListOf()

    // If there is a pending delivery, assign it to the driver
    val nextDelivery = pendingDeliveries.removeFirstOrNull()
    if (nextDelivery != null) {
      // Update the queue in state. Delivery was removed.
      ctx.set(PENDING_DELIVERIES, pendingDeliveries)
      // Notify that delivery is ongoing
      ctx.awakeableHandle(nextDelivery).resolve(driverId)
      return
    }

    // Otherwise remember driver as available
    val availableDrivers = ctx.get(AVAILABLE_DRIVERS) ?: mutableListOf()
    availableDrivers.add(driverId)
    ctx.set(AVAILABLE_DRIVERS, availableDrivers)
  }

  /**
   * Gets called when a new delivery gets scheduled. Links the delivery to the next driver
   * available. If no available drivers, the delivery is added to the pending deliveries queue
   */
  @Handler
  suspend fun requestDriverForDelivery(ctx: ObjectContext, deliveryCallbackId: String) {
    val availableDrivers = ctx.get(AVAILABLE_DRIVERS) ?: mutableListOf()

    // If a driver is available, assign the delivery right away
    val nextAvailableDriver = availableDrivers.removeFirstOrNull()
    if (nextAvailableDriver != null) {
      // Remove driver from the pool
      ctx.set(AVAILABLE_DRIVERS, availableDrivers)
      // Notify that delivery is ongoing
      ctx.awakeableHandle(deliveryCallbackId).resolve(nextAvailableDriver)
      return
    }

    // otherwise store the delivery request until a new driver becomes available
    val pendingDeliveries = ctx.get(PENDING_DELIVERIES) ?: mutableListOf()
    pendingDeliveries.add(deliveryCallbackId)
    ctx.set(PENDING_DELIVERIES, pendingDeliveries)
  }
}
