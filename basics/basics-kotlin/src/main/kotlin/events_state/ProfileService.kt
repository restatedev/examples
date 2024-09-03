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
package events_state

import dev.restate.sdk.annotation.Handler
import dev.restate.sdk.annotation.VirtualObject
import dev.restate.sdk.http.vertx.RestateHttpEndpointBuilder
import dev.restate.sdk.kotlin.*
import utils.*

//
// Populate state from events (from Kafka).
// Query the state via simple RPC/HTTP calls.
//
@VirtualObject
class ProfileService {

  // store in state the user's information as coming from the registration event
  @Handler
  suspend fun registration(ctx: ObjectContext, name: String) =
    ctx.set(NAME, name)

  // store in state the user's information as coming from the email event
  @Handler
  suspend fun email(ctx: ObjectContext, email: String) =
    ctx.set(EMAIL, email)

  // Get user profile
  @Handler
  suspend fun get(ctx: ObjectContext): UserProfile =
    UserProfile(
      ctx.key(),
      ctx.get(NAME) ?: "",
      ctx.get(EMAIL) ?: ""
    )
}

private val NAME = KtStateKey.json<String>("name")
private val EMAIL = KtStateKey.json<String>("email")

fun main() {
  RestateHttpEndpointBuilder.builder()
    .bind(ProfileService())
    .buildAndListen()
}
