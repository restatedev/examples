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
import dev.restate.sdk.examples.clients.PaymentClient
import dev.restate.sdk.examples.clients.RestaurantClient
import dev.restate.sdk.examples.utils.GeoUtils
import dev.restate.sdk.kotlin.*
import dev.restate.sdk.common.TerminalException
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
  suspend fun process(ctx: ObjectContext, order: OrderRequest) {
    // --- 📝 Created
    ctx.set(STATUS, Status.CREATED)

    // --- 💳 Payment
    val token: String = ctx.random().nextUUID().toString()
    val paid: Boolean = ctx.runBlock { PaymentClient.charge(order.orderId, token, order.totalCost) }
    if (!paid) {
      ctx.set(STATUS, Status.REJECTED)
      return
    }

    // --- 🕧 Scheduled
    ctx.set(STATUS, Status.SCHEDULED)
    ctx.sleep(order.deliveryDelay.milliseconds)

    // --- 🧑‍🍳 Preparing
    val preparationAwakeable = ctx.awakeable<Unit>()
    ctx.runBlock { RestaurantClient.prepare(order.orderId, preparationAwakeable.id) }
    ctx.set(STATUS, Status.IN_PREPARATION)
    preparationAwakeable.await()

    // Declare pick-up and delivery signals
    val pickupAwakeable = ctx.awakeable<Unit>()
    ctx.set(PICKUP_CALLBACK_ID, pickupAwakeable.id)
    val deliveryAwakeable = ctx.awakeable<Unit>()
    ctx.set(DELIVERY_CALLBACK_ID, deliveryAwakeable.id)

    // 🎙️ Scheduling delivery
    ctx.set(STATUS, Status.SCHEDULING_DELIVERY)
    startDelivery(ctx, order)

    // 🔜 Waiting for a driver
    ctx.set(STATUS, Status.WAITING_FOR_DRIVER)

    // 🚴 Delivery
    pickupAwakeable.await()
    ctx.set(STATUS, Status.IN_DELIVERY)

    // 😋 Delivered
    deliveryAwakeable.await()
    ctx.set(STATUS, Status.DELIVERED)
  }

  @Shared
  suspend fun getStatus(ctx: SharedObjectContext): Status {
    return ctx.get(STATUS) ?: Status.NEW
  }

  /**
   * Notifies that the delivery was picked up. Gets called by the DriverService.NotifyDeliveryPickup
   * when the driver has arrived at the restaurant.
   */
  @Shared
  suspend fun notifyDeliveryPickup(ctx: SharedObjectContext) {
    // Retrieve the delivery information for this delivery
    val callbackId =
        ctx.get(PICKUP_CALLBACK_ID)
            ?: throw TerminalException("Delivery was picked up but there is no ongoing delivery.")

    // Notify that the delivery was picked up
    ctx.awakeableHandle(callbackId).resolve(Unit)
  }

  /**
   * Notifies that the order was delivered. Gets called by the DriverService.NotifyDeliveryDelivered
   * when the driver has delivered the order to the customer.
   */
  @Shared
  suspend fun notifyDeliveryDelivered(ctx: SharedObjectContext) {
    // Retrieve the delivery information for this delivery
    val callbackId =
        ctx.get(DELIVERY_CALLBACK_ID)
            ?: throw TerminalException("Delivery was delivered but there is no ongoing delivery.")

    // Notify that the delivery has been completed
    ctx.awakeableHandle(callbackId).resolve(Unit)
  }

  /* Coordinates DriverDeliveryMatcher and DriverDigitalTwin to start a delivery */
  private suspend fun startDelivery(ctx: ObjectContext, order: OrderRequest) {
    // --- Wait for a driver to be available and acquire it
    val driverAwakeable = ctx.awakeable<String>()
    DriverDeliveryMatcherClient.fromContext(ctx, GeoUtils.DEMO_REGION)
        .send()
        .requestDriverForDelivery(driverAwakeable.id)
    // Wait until the driver pool service has located a driver
    // This awakeable gets resolved either immediately when there is a pending delivery
    // or later, when a new delivery comes in.
    val driverId = driverAwakeable.await()

    // --- Generate random restaurant/customer locations
    val restaurantLocation = ctx.runBlock { GeoUtils.randomLocation() }
    val customerLocation = ctx.runBlock { GeoUtils.randomLocation() }

    // --- Assign the driver to the job
    DriverDigitalTwinClient.fromContext(ctx, driverId)
        .assignDeliveryJob(
            AssignDeliveryRequest(
                order.orderId, order.restaurantId, restaurantLocation, customerLocation))
        .await()
  }
}
