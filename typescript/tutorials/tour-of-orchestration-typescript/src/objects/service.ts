import * as restate from "@restatedev/restate-sdk";
import { ObjectContext, ObjectSharedContext } from "@restatedev/restate-sdk";

export const userSubscriptions = restate.object({
  name: "UserSubscriptions",
  handlers: {
    add: async (ctx: ObjectContext, subscription: string) => {
      // Get current subscriptions
      const subscriptions = (await ctx.get<string[]>("subscriptions")) ?? [];

      // Add new subscription
      if (!subscriptions.includes(subscription)) {
        subscriptions.push(subscription);
      }
      ctx.set("subscriptions", subscriptions);

      // Update metrics
      ctx.set("lastUpdated", await ctx.date.toJSON());
    },

    getSubscriptions: restate.handlers.object.shared(
      async (ctx: ObjectSharedContext) => {
        return (await ctx.get<string[]>("subscriptions")) ?? [];
      },
    ),
  },
});
