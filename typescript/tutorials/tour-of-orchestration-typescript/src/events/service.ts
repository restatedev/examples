import * as restate from "@restatedev/restate-sdk";
import { initExternalPayment, PaymentRequest, PaymentResult } from "../utils";

export const asyncPaymentService = restate.service({
  name: "AsyncPaymentService",
  handlers: {
    processPayment: async (ctx: restate.Context, req: PaymentRequest) => {
      // Create awakeable to wait for webhook payment confirmation
      const confirmation = ctx.awakeable<PaymentResult>();

      // Initiate payment with external provider (Stripe, PayPal, etc.)
      await ctx.run("pay", () => initExternalPayment(req, confirmation.id));

      // Wait for external payment provider to call our webhook
      return confirmation.promise;
    },

    // Webhook handler called by external payment provider
    confirmPayment: async (
      ctx: restate.Context,
      confirmation: { id: string; result: PaymentResult },
    ) => {
      // Resolve the awakeable to continue the payment flow
      ctx.resolveAwakeable(confirmation.id, confirmation.result);
    },
  },
});
