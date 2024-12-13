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
    createPost, getPostStatus, PENDING,
    SocialMediaPost, updateUserFeed,
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
const userFeed = restate.object({
    name: "userFeed",
    handlers: {
        /*
         * The Kafka key routes events to the correct Virtual Object.
         * Events with the same key are processed one after the other.
         */
        processPost: async (ctx: restate.ObjectContext, post: SocialMediaPost) => {
            const userId = ctx.key

            let { postId, status } = await ctx.run(() => createPost(userId, post));
            while (status === PENDING) {
                // Delay processing until content moderation is complete (handler suspends when on FaaS).
                // This only blocks other posts for this user (Virtual Object), not for other users.
                await ctx.sleep(5_000);
                status = await ctx.run(() => getPostStatus(postId));
            }

            await ctx.run(() => updateUserFeed(userId, postId));
        },
    },
});

restate.endpoint().bind(userFeed).listen();

// Update users via Kafka or by calling the endpoint over HTTP:
/*
curl localhost:8080/userFeed/userid1/processPost --json '{"content": "Hi! This is my first post!", "metadata": "public"}'
*/
