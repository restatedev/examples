import * as restate from "@restatedev/restate-sdk";
import { createPost, getPostStatus, PENDING, SocialMediaPost, updateUserFeed } from "./utils/stubs";

//
// Processing events (from Kafka) to update various downstream systems
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
      const userId = ctx.key;

      const postId = await ctx.run(() => createPost(userId, post));

      // Delay processing until content moderation is complete (handler suspends when on FaaS).
      // This only blocks other posts for this user (Virtual Object), not for other users.
      while ((await ctx.run(() => getPostStatus(postId))) === PENDING) {
        await ctx.sleep({ seconds: 5 });
      }

      await ctx.run(() => updateUserFeed(userId, postId));
    },
  },
});

restate.serve({
  services: [userFeed],
});
// Process new posts for users via Kafka or by calling the endpoint over HTTP:
/*
curl localhost:8080/userFeed/userid1/processPost --json '{"content": "Hi! This is my first post!", "metadata": "public"}'
*/
