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
} from "./utils/stubs";

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
         * The Kafka key routes events to the correct Virtual Object.
         * Events with the same key are processed one after the other.
         */
        updateUserEvent: async (ctx: restate.ObjectContext, event: UserUpdate) => {
            const { profile, permissions, resources } = verifyEvent(event);

            // Event handlers can use all Durable Execution features of Restate
            let userId = await ctx.run(() => updateUserProfile(profile));
            while (userId === NOT_READY) {
                // Delay the processing by sleeping (handler suspends when on FaaS).
                // This only blocks other events for this user id (Virtual Object), not for the other users.
                await ctx.sleep(5_000);
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

// Update users via Kafka or by calling the endpoint over HTTP:
/*
curl localhost:8080/userUpdates/userid1/updateUserEvent --json '{"profile": "dev", "permissions": "all", "resources": "all"}'
*/
