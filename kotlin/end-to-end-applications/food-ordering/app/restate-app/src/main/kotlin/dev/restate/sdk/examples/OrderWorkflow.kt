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
import dev.restate.sdk.examples.clients.PaymentClient
import dev.restate.sdk.examples.clients.RestaurantClient
import dev.restate.sdk.examples.utils.GeoUtils
import dev.restate.sdk.kotlin.*
import kotlin.time.Duration.Companion.milliseconds

/**
 * Order processing workflow Gets called for each Kafka event that is published to the order topic.
 * The event contains the order ID and the raw JSON order. The workflow handles the payment, asks
 * the restaurant to start the preparation, and triggers the delivery.
 */
@VirtualObject
class OrderWorkflow {

  companion object {
    private val STATUS = stateKey<Status>("order-status")
    private val PICKUP_CALLBACK_ID = stateKey<String>("pickup-callback-id")
    private val DELIVERY_CALLBACK_ID = stateKey<String>("delivery-callback-id")
  }

  @Handler
  suspend fun process(order: OrderRequest) {
    val state = state()
    // --- 📝 Created
    state.set(STATUS, Status.CREATED)

    // --- 💳 Payment
    val token: String = random().nextUUID().toString()
    val paid: Boolean = runBlock { PaymentClient.charge(order.orderId, token, order.totalCost) }
    if (!paid) {
      state.set(STATUS, Status.REJECTED)
      return
    }

    // --- 🕧 Scheduled
    state.set(STATUS, Status.SCHEDULED)
    sleep(order.deliveryDelay.milliseconds)

    // --- 🧑‍🍳 Preparing
    val preparationAwakeable = awakeable<Unit>()
    runBlock { RestaurantClient.prepare(order.orderId, preparationAwakeable.id) }
    state.set(STATUS, Status.IN_PREPARATION)
    preparationAwakeable.await()

    // Declare pick-up and delivery signals
    val pickupAwakeable = awakeable<Unit>()
    state.set(PICKUP_CALLBACK_ID, pickupAwakeable.id)
    val deliveryAwakeable = awakeable<Unit>()
    state.set(DELIVERY_CALLBACK_ID, deliveryAwakeable.id)

    // 🎙️ Scheduling delivery
    state.set(STATUS, Status.SCHEDULING_DELIVERY)
    startDelivery(order)

    // 🔜 Waiting for a driver
    state.set(STATUS, Status.WAITING_FOR_DRIVER)

    // 🚴 Delivery
    pickupAwakeable.await()
    state.set(STATUS, Status.IN_DELIVERY)

    // 😋 Delivered
    deliveryAwakeable.await()
    state.set(STATUS, Status.DELIVERED)
  }

  @Shared
  suspend fun getStatus(): Status {
    return state().get(STATUS) ?: Status.NEW
  }

  /**
   * Notifies that the delivery was picked up. Gets called by the DriverService.NotifyDeliveryPickup
   * when the driver has arrived at the restaurant.
   */
  @Shared
  suspend fun notifyDeliveryPickup() {
    // Retrieve the delivery information for this delivery
    val callbackId =
        state().get(PICKUP_CALLBACK_ID)
            ?: throw TerminalException("Delivery was picked up but there is no ongoing delivery.")

    // Notify that the delivery was picked up
    awakeableHandle(callbackId).resolve(Unit)
  }

  /**
   * Notifies that the order was delivered. Gets called by the DriverService.NotifyDeliveryDelivered
   * when the driver has delivered the order to the customer.
   */
  @Shared
  suspend fun notifyDeliveryDelivered() {
    // Retrieve the delivery information for this delivery
    val callbackId =
        state().get(DELIVERY_CALLBACK_ID)
            ?: throw TerminalException("Delivery was delivered but there is no ongoing delivery.")

    // Notify that the delivery has been completed
    awakeableHandle(callbackId).resolve(Unit)
  }

  /* Coordinates DriverDeliveryMatcher and DriverDigitalTwin to start a delivery */
  private suspend fun startDelivery(order: OrderRequest) {
    // --- Wait for a driver to be available and acquire it
    val driverAwakeable = awakeable<String>()
    toVirtualObject<DriverDeliveryMatcher>(GeoUtils.DEMO_REGION)
        .request { requestDriverForDelivery(driverAwakeable.id) }
        .send()
    // Wait until the driver pool service has located a driver
    // This awakeable gets resolved either immediately when there is a pending delivery
    // or later, when a new delivery comes in.
    val driverId = driverAwakeable.await()

    // --- Generate random restaurant/customer locations
    val restaurantLocation = runBlock { GeoUtils.randomLocation() }
    val customerLocation = runBlock { GeoUtils.randomLocation() }

    // --- Assign the driver to the job
    virtualObject<DriverDigitalTwin>(driverId)
        .assignDeliveryJob(
            AssignDeliveryRequest(
                order.orderId,
                order.restaurantId,
                restaurantLocation,
                customerLocation,
            )
        )
  }
}
