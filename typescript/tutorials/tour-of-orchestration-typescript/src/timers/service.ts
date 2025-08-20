import * as restate from "@restatedev/restate-sdk";
import {
  cancelExternalPayment,
  initExternalPayment,
  PaymentRequest,
  PaymentResult,
} from "../utils";
import { TimeoutError } from "@restatedev/restate-sdk";

export const asyncPaymentServiceWithTimeout = restate.service({
  name: "AsyncPaymentServiceWithTimeout",
  handlers: {
    processPayment: async (ctx: restate.Context, req: PaymentRequest) => {
      const paymentConfirmation = ctx.awakeable<PaymentResult>();

      // Initiate payment with external provider
      const payRef = await ctx.run("init-payment", () =>
        initExternalPayment(req, paymentConfirmation.id),
      );

      // Race between payment confirmation and timeout
      try {
        return paymentConfirmation.promise.orTimeout({ minutes: 10 });
      } catch (e) {
        if (e instanceof TimeoutError) {
          // Cancel the payment with external provider
          await ctx.run("cancel-payment", () => cancelExternalPayment(payRef));
          return {
            success: false,
            errorMessage: "Payment timed out after 10 minutes",
          };
        }
        throw e;
      }
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
