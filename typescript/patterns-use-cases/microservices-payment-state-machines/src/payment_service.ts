/*
 * Copyright (c) 2024 - Restate Software, Inc., Restate GmbH
 *
 * This file is part of Restate Examples for the Node.js/TypeScript SDK,
 * which is released under the MIT license.
 *
 * You can find a copy of the license in file LICENSE in the root
 * directory of this repository or package, or at
 * https://github.com/restatedev/examples/blob/main/LICENSE
 */

import * as restate from "@restatedev/restate-sdk";
import type { AccountsObject }  from "./accounts/api";

type Payment = { accountId: string; amount: number };

type Result = { success: boolean; reason?: string };

type PaymentStatus = "NEW" | "COMPLETED" | "CANCELLED";

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
      const { accountId, amount } = checkTypes(payment);

      // check whether this payment-id was already processed (repeated call)
      const status = (await ctx.get<PaymentStatus>("status")) ?? "NEW";
      if (status === "CANCELLED") {
        return {
          success: false,
          reason: "This payment-id was already cancelled",
        };
      }
      if (status === "COMPLETED") {
        return { success: true, reason: "Already completed in a prior call" };
      }

      // charge the target account
      const paymentResult = await ctx
        .objectClient(Accounts, accountId)
        .withdraw(amount);

      if (paymentResult.success) {
        ctx.set("status", "COMPLETED");
        ctx.set("payment", payment);

        const self = ctx.key;
        ctx.objectSendClient(payments, self, { delay: EXPIRY_TIMEOUT })
          .expireToken();
      }

      return paymentResult;
    },

    cancelPayment: async (ctx: restate.ObjectContext) => {
      const status = (await ctx.get<PaymentStatus>("status")) ?? "NEW";

      switch (status) {
        case "NEW": {
          // not seen this token before, mark as canceled, in case the cancellation
          // overtook the actual payment request (on the external caller's side)
          ctx.set("status", "CANCELLED");

          ctx
            .objectSendClient(payments, ctx.key, { delay: EXPIRY_TIMEOUT })
            .expireToken();
          break;
        }

        case "CANCELLED":
          // already cancelled, this is a repeated request
          break;

        case "COMPLETED": {
          ctx.set("status", "CANCELLED");

          // undo the payment
          const { accountId, amount } = (await ctx.get<Payment>("payment"))!;
          ctx.objectSendClient(Accounts, accountId).deposit(amount);
          break;
        }
      }
    },

    expireToken: async (ctx: restate.ObjectContext) => {
      ctx.clearAll();
    },
  },
});

const Accounts: AccountsObject = { name : "accounts" };

// ----------------------------------------------------------------------------
//  serve everything
// ----------------------------------------------------------------------------

import {default as accounts} from "./accounts/impl";

restate
  .endpoint()
  .bind(payments)
  .bind(accounts)
  .listen();

// ----------------------------------------------------------------------------
//  miscellaneous utils
// ----------------------------------------------------------------------------

function checkTypes(payment: Payment): Payment {
  if (typeof payment.accountId !== "string") {
    throw new restate.TerminalError("Wrong type for accountId " + typeof payment.accountId);
  }
  if (typeof payment.amount === "number") {
    return payment;
  } else {
    try {
      return { accountId: payment.accountId, amount: Number(payment.amount) };
    } catch (e) {
      throw new restate.TerminalError(
        `Type for amount (${typeof payment.amount}) cannot convert amount to number: ${
          payment.amount
        }`,
        { errorCode: 500 }
      );
    }
  }
}
