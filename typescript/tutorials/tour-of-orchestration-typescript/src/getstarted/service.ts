import * as restate from "@restatedev/restate-sdk";
import {
  createRecurringPayment,
  createSubscription,
  SubscriptionRequest,
} from "../utils";
import { Context } from "@restatedev/restate-sdk";

export const subscriptionService = restate.service({
  name: "SubscriptionService",
  handlers: {
    add: async (ctx: Context, req: SubscriptionRequest) => {
      const paymentId = ctx.rand.uuidv4();

      const payRef = await ctx.run("pay", () =>
        createRecurringPayment(req.creditCard, paymentId),
      );

      for (const subscription of req.subscriptions) {
        await ctx.run(`subscribe-${subscription}`, () =>
          createSubscription(req.userId, subscription, payRef),
        );
      }
    },
  },
});
