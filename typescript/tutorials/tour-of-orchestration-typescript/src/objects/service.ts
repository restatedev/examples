import * as restate from "@restatedev/restate-sdk";

export const userSubscriptions = restate.object({
  name: "UserSubscriptions",
  handlers: {
    addSubscription: async (
      ctx: restate.ObjectContext,
      subscription: string,
    ) => {
      // Get current subscriptions
      const subscriptions = (await ctx.get<string[]>("subscriptions")) ?? [];

      // Add new subscription
      if (!subscriptions.includes(subscription)) {
        subscriptions.push(subscription);
      }
      ctx.set("subscriptions", subscriptions);

      // Update metrics
      ctx.set("lastUpdated", ctx.date.toJSON());
    },

    getSubscriptions: async (ctx: restate.ObjectContext): Promise<string[]> => {
      return (await ctx.get<string[]>("subscriptions")) ?? [];
    },
  },
});
