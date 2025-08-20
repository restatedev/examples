import * as restate from "@restatedev/restate-sdk";
import {
  createRecurringPayment,
  createSubscription,
  removeRecurringPayment,
  removeSubscription,
  SubscriptionRequest,
} from "../utils";

export const subscriptionSaga = restate.service({
  name: "SubscriptionSaga",
  handlers: {
    add: async (ctx: restate.Context, req: SubscriptionRequest) => {
      const compensations = [];

      try {
        // Step 1: Create payment
        const paymentId = ctx.rand.uuidv4();
        compensations.push(() =>
          ctx.run("undo-pay", () => removeRecurringPayment(paymentId)),
        );

        const payRef = await ctx.run("pay", () =>
          createRecurringPayment(req.creditCard, paymentId),
        );

        // Step 2: Create subscriptions
        for (const subscription of req.subscriptions) {
          compensations.push(() =>
            ctx.run(`remove-${subscription}`, () =>
              removeSubscription(req.userId, subscription),
            ),
          );

          await ctx.run(`subscribe-${subscription}`, () =>
            createSubscription(req.userId, subscription, payRef),
          );
        }
      } catch (e) {
        if (e instanceof restate.TerminalError) {
          // Run compensations in reverse order
          for (const compensation of compensations.reverse()) {
            await compensation();
          }
        }
        throw e;
      }
    },
  },
});
