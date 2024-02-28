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
import * as accounts from "./utils/accounts";

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
 * This is implemented as a virtual object (keyed service) to ensure that only
 * one concurrent request can happen per token (requests are queued and
 * processed sequentially per token).
 *
 * Note that this idempotency-token is more of an operation/payment-id.
 * Methods can be called multiple times with the same token, but payment
 * will be executed only once. Also if a cancellation is triggered for that
 * token, the payment will not happen or be undine, regardless of whether
 * the cancel call comes before or after the payment call.
 */
const paymentsService = restate.keyedRouter({
  makePayment: async (
    ctx: restate.KeyedContext,
    idempotencyToken: string,
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
    } else if (status === PaymentStatus.COMPLETED_SUCCESSFULLY) {
      return { success: true, reason: "Already completed in a prior call" };
    }

    // we check the types, because external calls via http may evade some type checks
    const { accountId, amount } = checkTypes(payment);

    // charge the target account
    const paymentResult = await ctx
      .rpc(accounts.api)
      .withdraw(accountId, amount);

    // remember only on success, so that on failure (when we didn't charge) the external
    // caller may retry this (with the same token), for the sake of this example
    if (paymentResult.success) {
      ctx.set("status", PaymentStatus.COMPLETED_SUCCESSFULLY);
      ctx.set("payment", payment); // remember this in case we need to roll-back later
      ctx
        .sendDelayed(paymentsApi, EXPIRY_TIMEOUT)
        .expireToken(idempotencyToken);
    }

    return paymentResult;
  },

  cancelPayment: async (
    ctx: restate.KeyedContext,
    idempotencyToken: string
  ) => {
    const status: PaymentStatus =
      (await ctx.get("status")) ?? PaymentStatus.NEW;

    switch (status) {
      case PaymentStatus.NEW:
        // not seen this token before, mark as canceled, in case the cancellation
        // overtook the actual payment request (on the externall caller's side)
        ctx.set("status", PaymentStatus.CANCELLED);
        ctx
          .sendDelayed(paymentsApi, EXPIRY_TIMEOUT)
          .expireToken(idempotencyToken);
        break;

      case PaymentStatus.CANCELLED:
        // already cancelled, this is a repeated request
        break;

      case PaymentStatus.COMPLETED_SUCCESSFULLY: {
        // remember this as cancelled
        ctx.set("status", PaymentStatus.CANCELLED);

        // undo the payment
        const { accountId, amount } = (await ctx.get<Payment>("payment"))!;
        ctx.send(accounts.api).deposit(accountId, amount);
        break;
      }
    }
  },

  expireToken: async (ctx: restate.KeyedContext) => {
    ctx.clear("status");
    ctx.clear("payment");
  },
});

const paymentsApi: restate.ServiceApi<typeof paymentsService> = {
  path: "payments",
};

restate
  .endpoint()
  .bindKeyedRouter(paymentsApi.path, paymentsService)
  .bindKeyedRouter(accounts.api.path, accounts.userAccountObjects)
  .listen();

// ----------------------------------------------------------------------------
//  miscellaneous utils
// ----------------------------------------------------------------------------

function checkTypes(payment: Payment): Payment {
  if (typeof payment.accountId !== "string") {
    throw new restate.TerminalError(
      "Wrong type for accountId " + typeof payment.accountId
    );
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
        { errorCode: restate.ErrorCodes.INVALID_ARGUMENT }
      );
    }
  }
}
