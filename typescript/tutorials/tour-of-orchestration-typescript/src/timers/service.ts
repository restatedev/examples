import * as restate from "@restatedev/restate-sdk";
import {
  cancelPayment,
  initPayment,
  PaymentRequest,
  PaymentResult,
} from "../utils";
import { Context, TerminalError, TimeoutError } from "@restatedev/restate-sdk";

export const paymentsWithTimeout = restate.service({
  name: "PaymentsWithTimeout",
  handlers: {
    process: async (ctx: Context, req: PaymentRequest) => {
      const confirmation = ctx.awakeable<PaymentResult>();

      const payRef = await ctx.run("pay", () =>
        initPayment(req, confirmation.id),
      );

      // <start_or_timeout>
      // Race between payment confirmation and timeout
      try {
        return await confirmation.promise.orTimeout({ seconds: 30 });
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
      // <end_or_timeout>
    },

    confirm: async (
      ctx: Context,
      confirmation: { id: string; result: PaymentResult },
    ) => {
      ctx.resolveAwakeable(confirmation.id, confirmation.result);
    },
  },
});
