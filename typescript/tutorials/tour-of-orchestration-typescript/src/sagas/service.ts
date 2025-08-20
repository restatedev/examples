import * as restate from "@restatedev/restate-sdk";
import {
  createRecurringPayment,
  createSubscription,
  removeRecurringPayment,
  removeSubscription,
  SubscriptionRequest,
} from "../utils";
import { Context } from "@restatedev/restate-sdk";

export const subscriptionSaga = restate.service({
  name: "SubscriptionSaga",
  handlers: {
    add: async (ctx: Context, req: SubscriptionRequest) => {
      // <start_saga>
      const compensations = [];

      try {
        const paymentId = ctx.rand.uuidv4();
        compensations.push(() =>
          ctx.run("undo-pay", () => removeRecurringPayment(paymentId)),
        );
        const payRef = await ctx.run("pay", () =>
          createRecurringPayment(req.creditCard, paymentId),
        );

        for (const subscription of req.subscriptions) {
          compensations.push(() =>
            ctx.run(`del-${subscription}`, () =>
              removeSubscription(req.userId, subscription),
            ),
          );
          await ctx.run(`add-${subscription}`, () =>
            createSubscription(req.userId, subscription, payRef),
          );
        }
      } catch (e) {
        if (e instanceof restate.TerminalError) {
          for (const compensation of compensations.reverse()) {
            await compensation();
          }
        }
        throw e;
      }
      // <end_saga>
    },
  },
});
