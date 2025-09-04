import * as restate from "@restatedev/restate-sdk";
import { initPayment, PaymentRequest, PaymentResult } from "../utils";
import { Context } from "@restatedev/restate-sdk";

export const payments = restate.service({
  name: "Payments",
  handlers: {
    process: async (ctx: Context, req: PaymentRequest) => {
      // Create awakeable to wait for webhook payment confirmation
      const confirmation = ctx.awakeable<PaymentResult>();

      // Initiate payment with external provider (Stripe, PayPal, etc.)
      const paymentId = ctx.rand.uuidv4();
      await ctx.run("pay", () => initPayment(req, paymentId, confirmation.id));

      // Wait for external payment provider to call our webhook
      return confirmation.promise;
    },

    // Webhook handler called by external payment provider
    confirm: async (
      ctx: Context,
      confirmation: { id: string; result: PaymentResult },
    ) => {
      // Resolve the awakeable to continue the payment flow
      ctx.resolveAwakeable(confirmation.id, confirmation.result);
    },
  },
});
