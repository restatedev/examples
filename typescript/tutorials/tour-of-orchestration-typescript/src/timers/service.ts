import * as restate from "@restatedev/restate-sdk";
import {
  cancelPayment,
  initPayment,
  PaymentRequest,
  PaymentResult,
} from "../utils";
import { Context, TimeoutError } from "@restatedev/restate-sdk";

export const paymentsWithTimeout = restate.service({
  name: "PaymentsWithTimeout",
  handlers: {
    process: async (ctx: Context, req: PaymentRequest) => {
      const confirmation = ctx.awakeable<PaymentResult>();

      const payRef = await ctx.run("pay", () =>
        initPayment(req, confirmation.id),
      );

      // Race between payment confirmation and timeout
      try {
        return confirmation.promise.orTimeout({ minutes: 10 });
      } catch (e) {
        if (e instanceof TimeoutError) {
          // Cancel the payment with external provider
          await ctx.run("cancel-payment", () => cancelPayment(payRef));
          return {
            success: false,
            errorMessage: "Payment timeout",
          };
        }
        throw e;
      }
    },

    confirm: async (
      ctx: Context,
      confirmation: { id: string; result: PaymentResult },
    ) => {
      ctx.resolveAwakeable(confirmation.id, confirmation.result);
    },
  },
});
