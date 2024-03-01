/*
 * Copyright (c) 2024 - Restate Software, Inc., Restate GmbH
 *
 * This file is part of the Restate Examples for the Node.js/TypeScript SDK,
 * which is released under the MIT license.
 *
 * You can find a copy of the license in the file LICENSE
 * in the root directory of this repository or package or at
 * https://github.com/restatedev/examples/blob/main/LICENSE
 */

import * as restate from "@restatedev/restate-sdk";
import {
  NOT_READY,
  UserUpdate,
  provisionResources,
  setupUserPermissions,
  updateUserProfile,
  verifyEvent,
} from "./utils/event_proc_stubs";

//
// Processing events (from Kafka) to update various downstream systems.
//  - Journalling actions in Restate and driving retries from Restate, recovering
//    partial progress
//  - Preserving the order-per-key, but otherwise allowing high-fanout, because
//    processing of events does not block other events.
//  - Ability to delay events when the downstream systems are busy, without blocking
//    entire partitions.
//

const userUpdates = restate.keyedRouter({
  /*
   * This is marked as a 'keyedEventHandler' - it acceps a 'Event' type and
   * uses the Event's key (populated for example from Kafka's key) to route the events
   * and ensure that events with the same key are processed one after the other.
   */
  updateUserEvent: restate.keyedEventHandler(
    async (ctx: restate.KeyedContext, event: restate.Event) => {
      const { profile, permissions, resources } = verifyEvent(event.json());

      // event handler is a durably executed function that can use all the features of Restate
      let userId = await ctx.sideEffect(() => updateUserProfile(profile));
      while (userId === NOT_READY) {
        // delay the event processing. this delays this event, but only queues events for the same
        // key. all other events proceed - no partition blocking.
        // the sleep suspends the function (e.g., when running on FaaS)
        ctx.sleep(5_000);
        userId = await ctx.sideEffect(() => updateUserProfile(profile));
      }

      const roleId = await ctx.sideEffect(() => setupUserPermissions(userId, permissions));
      await ctx.sideEffect(() => provisionResources(userId, roleId, resources));
    }
  ),
});
