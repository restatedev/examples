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

import dev.restate.sdk.common.Component
import dev.restate.sdk.common.CoreSerdes
import dev.restate.sdk.common.StateKey
import dev.restate.sdk.examples.generated.*
import dev.restate.sdk.examples.generated.GreeterProto.GreetRequest
import dev.restate.sdk.examples.generated.GreeterProto.GreetResponse
import dev.restate.sdk.kotlin.ObjectContext
import kotlinx.coroutines.Dispatchers

class Greeter :
    // Use Dispatchers.Unconfined as the Executor/thread pool is managed by the SDK itself.
    GreeterGrpcKt.GreeterCoroutineImplBase(Dispatchers.Unconfined),
    Component {

  companion object {
    private val COUNT = StateKey.of("count", CoreSerdes.JSON_INT)
  }

  override suspend fun greet(request: GreetRequest): GreetResponse {
    val ctx = ObjectContext.current()

    val count = ctx.get(COUNT) ?: 1
    ctx.set(COUNT, count + 1)

    return greetResponse {
      message = "Hello ${request.name} for the $count time!"
    }
  }
}
