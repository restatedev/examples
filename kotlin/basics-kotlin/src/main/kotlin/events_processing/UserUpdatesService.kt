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
package events_processing

import dev.restate.sdk.annotation.Handler
import dev.restate.sdk.annotation.VirtualObject
import dev.restate.sdk.http.vertx.RestateHttpEndpointBuilder
import dev.restate.sdk.kotlin.*
import utils.*
import kotlin.time.Duration.Companion.seconds

//
// Processing events (from Kafka) to update various downstream systems.
//  - Journaling actions in Restate and driving retries from Restate, recovering
//    partial progress
//  - Preserving the order-per-key, but otherwise allowing high-fanout, because
//    processing of events does not block other events.
//  - Ability to delay events when the downstream systems are busy, without blocking
//    entire partitions.
//
@VirtualObject
class UserUpdatesService {
  /*
   * uses the Event's key (populated for example from Kafka's key) to route the events to the correct Virtual Object.
   * And ensures that events with the same key are processed one after the other.
   */
  @Handler
  suspend fun updateUserEvent(ctx: ObjectContext, update: UserUpdate) {
    // event handler is a durably executed function that can use all the features of Restate

    var userId = ctx.runBlock { updateUserProfile(update.profile) }
    while (userId == "NOT_READY") {
      // Delay the processing of the event by sleeping.
      // The other events for this Virtual Object / key are queued.
      // Events for other keys are processed concurrently.
      // The sleep suspends the function (e.g., when running on FaaS).
      ctx.sleep(5.seconds)
      userId = ctx.runBlock { updateUserProfile(update.profile) }
    }


    val finalUserId = userId
    val roleId = ctx.runBlock { setUserPermissions(finalUserId, update.permissions) }
    ctx.runBlock { provisionResources(finalUserId, roleId, update.resources) }
  }

}

fun main() {
  RestateHttpEndpointBuilder.builder()
    .bind(UserUpdatesService())
    .buildAndListen()
}
