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
import dev.restate.sdk.examples.clients.PaymentClient
import dev.restate.sdk.examples.clients.RestaurantClient
import dev.restate.sdk.kotlin.ObjectContext
import dev.restate.sdk.kotlin.awakeable
import dev.restate.sdk.kotlin.runBlock
import kotlin.time.Duration.Companion.milliseconds

/**
 * Order processing workflow Gets called for each Kafka event that is published to the order topic.
 * The event contains the order ID and the raw JSON order. The workflow handles the payment, asks
 * the restaurant to start the preparation, and triggers the delivery.
 */
@VirtualObject
class OrderWorkflow {

  @Handler
  suspend fun create(ctx: ObjectContext, order: OrderRequest) {
    val id: String = order.orderId

    val orderStatusSend = OrderStatusServiceClient.fromContext(ctx, id)

    // 1. Set status
    orderStatusSend.send().setStatus(StatusEnum.CREATED)

    // 2. Handle payment
    val token: String = ctx.random().nextUUID().toString()
    val paid: Boolean = ctx.runBlock { PaymentClient.charge(id, token, order.totalCost) }

    if (!paid) {
      orderStatusSend.send().setStatus(StatusEnum.REJECTED)
      return
    }

    // 3. Schedule preparation
    orderStatusSend.setStatus(StatusEnum.SCHEDULED)
    ctx.sleep(order.deliveryDelay.milliseconds)

    // 4. Trigger preparation
    val preparationAwakeable = ctx.awakeable<Unit>()
    ctx.runBlock { RestaurantClient.prepare(id, preparationAwakeable.id) }
    orderStatusSend.setStatus(StatusEnum.IN_PREPARATION)

    preparationAwakeable.await()
    orderStatusSend.setStatus(StatusEnum.SCHEDULING_DELIVERY)

    // 5. Find a driver and start delivery
    val deliveryAwakeable = ctx.awakeable<Unit>()

    DeliveryManagerClient.fromContext(ctx, id)
        .send()
        .start(DeliveryRequest(order.restaurantId, deliveryAwakeable.id))
    deliveryAwakeable.await()
    orderStatusSend.setStatus(StatusEnum.DELIVERED)
  }
}
