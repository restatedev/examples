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
import kotlinx.serialization.Serializable

@Serializable
data class GreetResponse(val message: String)

@VirtualObject
class Greeter {
  companion object {
    private val COUNT = KtStateKey.json<Long>("count")
  }

  @Handler
  suspend fun greet(ctx: ObjectContext, name: String): GreetResponse {
    val count = ctx.get(COUNT) ?: 1
    ctx.set(COUNT, count + 1)

    return GreetResponse(
      message= "Hello ${name} for the $count time!"
    )
  }
}
