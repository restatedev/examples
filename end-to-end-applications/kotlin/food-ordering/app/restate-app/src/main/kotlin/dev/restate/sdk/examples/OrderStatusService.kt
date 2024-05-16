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

@VirtualObject
class OrderStatusService {
  companion object {
    private val ORDER_STATUS = KtStateKey.json<StatusEnum>("order-status")
    private val ORDER_ETA = KtStateKey.json<Long>("order-eta")
  }

  /** Gets called by the webUI frontend to display the status of an order. */
  @Handler
  suspend fun get(ctx: ObjectContext): OrderStatus {
    return OrderStatus(ctx.get(ORDER_STATUS) ?: StatusEnum.NEW, ctx.get(ORDER_ETA) ?: -1L)
  }

  @Handler
  suspend fun setStatus(ctx: ObjectContext, statusEnum: StatusEnum) {
    ctx.set(ORDER_STATUS, statusEnum)
  }

  @Handler
  suspend fun setETA(ctx: ObjectContext, eta: Long) {
    ctx.set(ORDER_ETA, eta)
  }
}
