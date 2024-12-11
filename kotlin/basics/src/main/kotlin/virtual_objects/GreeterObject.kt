/*
 * Copyright (c) 2024 - Restate Software, Inc., Restate GmbH
 *
 * This file is part of the Restate Examples
 * which is released under the MIT license.
 *
 * You can find a copy of the license in the file LICENSE
 * in the root directory of this repository or package or at
 * https://github.com/restatedev/examples/blob/main/LICENSE
 */
package virtual_objects

import dev.restate.sdk.annotation.Handler
import dev.restate.sdk.annotation.VirtualObject
import dev.restate.sdk.http.vertx.RestateHttpEndpointBuilder
import dev.restate.sdk.kotlin.KtStateKey
import dev.restate.sdk.kotlin.ObjectContext

//
// Virtual Objects hold state and have methods to interact with the object.
// An object is identified by a unique id - only one object exists per id.
//
// Virtual Objects have their state locally accessible without requiring any database
// connection or lookup. State is exclusive, and atomically committed with the
// method execution.
//
// Virtual Objects are _Stateful Serverless_ constructs.
//
@VirtualObject
class GreeterObject {
  @Handler
  suspend fun greet(ctx: ObjectContext, greeting: String): String  {
    // Access the state attached to this object (this 'name')
    // State access and updates are exclusive and consistent with the invocations

    val count = ctx.get(COUNT) ?: 0
    val newCount = count + 1
    ctx.set(COUNT, newCount)

    return "$greeting ${ctx.key()}, for the $newCount-th time"
  }

  @Handler
  suspend fun ungreet(ctx: ObjectContext): String {
    val count = ctx.get(COUNT) ?: 0
    if (count > 0) {
      val newCount = count - 1
      ctx.set(COUNT, newCount)
    }

    return "Dear ${ctx.key()}, taking one greeting back: $count"
  }
}

private val COUNT = KtStateKey.json<Int>("available-drivers")

fun main() {
  RestateHttpEndpointBuilder.builder()
    .bind(GreeterObject())
    .buildAndListen()
}

// See README for details on how to start and connect to Restate.
// Call this service through HTTP directly the following way:
// Example1: `curl localhost:8080/GreeterObject/mary/greet -H 'content-type: application/json' -d '"Hi"'`;
// Example2: `curl localhost:8080/GreeterObject/barack/greet -H 'content-type: application/json' -d '"Hello"'`;
// Example3: `curl localhost:8080/GreeterObject/mary/ungreet -H 'content-type: application/json' -d ''`;

