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
//  - Journaling actions in Restate and driving retries from Restate, recovering
//    partial progress
//  - Preserving the order-per-key, but otherwise allowing high-fanout, because
//    processing of events does not block other events.
//  - Ability to delay events when the downstream systems are busy, without blocking
//    entire partitions.
//

const userUpdates = restate.object({
  name: "userUpdates",
  handlers: {
    /*
     * uses the Event's key (populated for example from Kafka's key) to route the events to the correct Virtual Object
     * and ensure that events with the same key are processed one after the other.
     */
    updateUserEvent: async (ctx: restate.ObjectContext, event: UserUpdate) => {
      const { profile, permissions, resources } = verifyEvent(event);

      // event handler is a durably executed function that can use all the features of Restate
      let userId = await ctx.run(() => updateUserProfile(profile));
      while (userId === NOT_READY) {
        // Delay the processing of the event by sleeping.
        // The other events for this Virtual Object / key are queued.
        // Events for other keys are processed concurrently.
        // The sleep suspends the function (e.g., when running on FaaS).
        ctx.sleep(5_000);
        userId = await ctx.run(() => updateUserProfile(profile));
      }

      const roleId = await ctx.run(() =>
        setupUserPermissions(userId, permissions)
      );
      await ctx.run(() => provisionResources(userId, roleId, resources));
    },
  },
});

restate.endpoint().bind(userUpdates).listen();

// Update users via creating a Kafka subscriptions or calling the endpoint directly:
/*
curl localhost:8080/userUpdates/userid1/updateUserEvent --json '{"profile": "dev", "permissions": "all", "resources": "all"}'
*/
