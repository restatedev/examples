import * as restate from "@restatedev/restate-sdk";
import { sendReminderEmail, escalateToHuman, StripeEvent } from "./utils/stubs";

const paymentTracker = restate.object({
  // one instance per invoice id
  name: "PaymentTracker",
  handlers: {
    onPaymentSuccess: async (ctx: restate.ObjectContext, event: StripeEvent) => {
      // Mark the invoice as paid
      ctx.set("paid", true);
    },

    onPaymentFailure: async (ctx: restate.ObjectContext, event: StripeEvent) => {
      if (await ctx.get<boolean>("paid")) {
        return;
      }

      const remindersCount = (await ctx.get<number>("reminders_count")) ?? 0;
      if (remindersCount < 3) {
        ctx.set("reminders_count", remindersCount + 1);
        await ctx.run(() => sendReminderEmail(event));

        // Schedule next reminder via a delayed self call
        ctx
          .objectSendClient(
            PaymentTracker,
            ctx.key, // this object's invoice id
            { delay: 24 * 60 * 60 * 1000 }
          )
          .onPaymentFailure(event);
      } else {
        await ctx.run(() => escalateToHuman(event));
      }
    },
  },
});

const PaymentTracker: typeof paymentTracker = { name: "PaymentTracker" };

restate.endpoint().bind(paymentTracker).listen(9080);
