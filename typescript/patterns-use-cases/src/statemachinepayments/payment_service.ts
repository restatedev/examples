import * as restate from "@restatedev/restate-sdk";
import type { AccountsObject } from "./accounts";
import { accountsObject } from "./accounts";

type Payment = { accountId: string; amount: number };

type PaymentStatus = "NEW" | "COMPLETED" | "CANCELLED";

const Accounts: AccountsObject = { name: "accounts" };

const EXPIRY_TIMEOUT = 60 * 60 * 1000; // 1 hour

/**
 * The service that processes the payment requests.
 *
 * This is implemented as a virtual object to ensure that only
 * one concurrent request can happen per payment-id (requests are queued and
 * processed sequentially per id).
 *
 * Methods can be called multiple times with the same payment-id, but payment
 * will be executed only once. If a cancellation is triggered for that
 * token, the payment will not happen or be undone, regardless of whether
 * the cancel call comes before or after the payment call.
 */
const payments = restate.object({
  name: "payments",
  handlers: {
    makePayment: async (ctx: restate.ObjectContext, payment: Payment) => {
      const { accountId, amount } = payment;
      const paymentId = ctx.key;

      // check whether this payment-id was already processed (repeated call)
      switch (await ctx.get<PaymentStatus>("status")) {
        case "COMPLETED":
          return `${paymentId} was cancelled before`;
        case "CANCELLED":
          return `${paymentId} previously completed`;
      }

      // charge the target account
      const paymentResult = await ctx.objectClient(Accounts, accountId).withdraw(amount);

      if (paymentResult.success) {
        ctx.set("status", "COMPLETED");
        ctx.set("payment", payment);

        ctx.objectSendClient(payments, paymentId, { delay: EXPIRY_TIMEOUT }).expireToken();
      }

      return `${paymentId} successful: ${paymentResult.success}`;
    },

    cancelPayment: async (ctx: restate.ObjectContext) => {
      const status = (await ctx.get<PaymentStatus>("status")) ?? "NEW";

      switch (status) {
        case "COMPLETED": {
          // undo the payment
          const { accountId, amount } = (await ctx.get<Payment>("payment"))!;
          ctx.objectSendClient(Accounts, accountId).deposit(amount);
          ctx.set("status", "CANCELLED");
          break;
        }

        case "CANCELLED":
          // already cancelled, this is a repeated request
          break;

        case "NEW": {
          // We have not seen this token before, so mark it as canceled.
          // The cancellation may have overtaken the actual payment request before arriving at Restate.
          ctx.set("status", "CANCELLED");

          ctx.objectSendClient(payments, ctx.key, { delay: EXPIRY_TIMEOUT }).expireToken();
          break;
        }
      }
    },

    expireToken: async (ctx: restate.ObjectContext) => {
      ctx.clearAll();
    },
  },
});

restate.serve({
  services: [payments, accountsObject],
});
