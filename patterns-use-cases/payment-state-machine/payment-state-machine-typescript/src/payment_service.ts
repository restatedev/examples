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
import type {AccountsObject}  from "./accounts/api";

type Payment = { accountId: string; amount: number };

type Result = { success: boolean; reason?: string };

enum PaymentStatus {
  NEW = 0,
  COMPLETED_SUCCESSFULLY = 1,
  CANCELLED = 2,
}

const EXPIRY_TIMEOUT = 60 * 60 * 1000; // 1 hour

/**
 * The service that processes the payment requests.
 *
 * This is implemented as a virtual object to ensure that only
 * one concurrent request can happen per token (requests are queued and
 * processed sequentially per token).
 *
 * Note that this idempotency-token is more of an operation/payment-id.
 * Methods can be called multiple times with the same token, but payment
 * will be executed only once. Also, if a cancellation is triggered for that
 * token, the payment will not happen or be undine, regardless of whether
 * the cancel call comes before or after the payment call.
 */

const payments = restate.object({
  name: "payments",
  handlers: {
    makePayment: async (
      ctx: restate.ObjectContext,
      payment: Payment
    ): Promise<Result> => {
      // de-duplication to make calls idempotent
      const status: PaymentStatus =
        (await ctx.get("status")) ?? PaymentStatus.NEW;
      if (status === PaymentStatus.CANCELLED) {
        return {
          success: false,
          reason: "This token was already marked as cancelled",
        };
      }
      if (status === PaymentStatus.COMPLETED_SUCCESSFULLY) {
        return { success: true, reason: "Already completed in a prior call" };
      }

      // we check the types, because external calls via http may evade some type checks
      const { accountId, amount } = checkTypes(payment);

      // charge the target account
      const paymentResult = await ctx
        .objectClient(AccountsObject, accountId)
        .withdraw(amount);

      // remember only on success, so that on failure (when we didn't charge) the external
      // caller may retry this (with the same token), for the sake of this example
      if (paymentResult.success) {
        ctx.set("status", PaymentStatus.COMPLETED_SUCCESSFULLY);
        ctx.set("payment", payment); // remember this in case we need to roll-back later

        const idempotencyToken = ctx.key;
        ctx
          .objectSendClient(PaymentsObject, idempotencyToken, {
            delay: EXPIRY_TIMEOUT,
          })
          .expireToken();
      }

      return paymentResult;
    },

    cancelPayment: async (ctx: restate.ObjectContext) => {
      const status: PaymentStatus =
        (await ctx.get("status")) ?? PaymentStatus.NEW;

      switch (status) {
        case PaymentStatus.NEW: {
          // not seen this token before, mark as canceled, in case the cancellation
          // overtook the actual payment request (on the external caller's side)
          ctx.set("status", PaymentStatus.CANCELLED);

          ctx
            .objectSendClient(PaymentsObject, ctx.key, {
              delay: EXPIRY_TIMEOUT,
            })
            .expireToken();
          break;
        }

        case PaymentStatus.CANCELLED:
          // already cancelled, this is a repeated request
          break;

        case PaymentStatus.COMPLETED_SUCCESSFULLY: {
          // remember this as cancelled
          ctx.set("status", PaymentStatus.CANCELLED);

          // undo the payment
          const { accountId, amount } = (await ctx.get<Payment>("payment"))!;
          ctx.objectSendClient(AccountsObject, accountId).deposit(amount);
          break;
        }
      }
    },

    expireToken: async (ctx: restate.ObjectContext) => {
      ctx.clear("status");
      ctx.clear("payment");
    },
  },
});

const AccountsObject: AccountsObject = { name : "accounts" };
const PaymentsObject: typeof payments = { name: "payments" };

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
