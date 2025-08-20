import * as restate from "@restatedev/restate-sdk";
import {
  initiateExternalPayment,
  PaymentRequest,
  PaymentResult,
} from "../utils";

export const asyncPaymentService = restate.service({
  name: "AsyncPaymentService",
  handlers: {
    processPayment: async (
      ctx: restate.Context,
      req: PaymentRequest,
    ): Promise<PaymentResult> => {
      // Create awakeable to wait for webhook confirmation
      const paymentConfirmation = ctx.awakeable<PaymentResult>();

      // Initiate payment with external provider (Stripe, PayPal, etc.)
      await ctx.run("init-payment", () =>
        initiateExternalPayment(req, paymentConfirmation.id),
      );

      // Wait for external payment provider to call our webhook
      return paymentConfirmation.promise;
    },

    // Webhook handler called by external payment provider
    confirmPayment: async (
      ctx: restate.Context,
      confirmation: { awakeableId: string; result: PaymentResult },
    ) => {
      // Resolve the awakeable to continue the payment flow
      ctx.resolveAwakeable(confirmation.awakeableId, confirmation.result);
    },
  },
});
