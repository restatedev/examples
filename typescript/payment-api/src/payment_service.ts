/*
 * Copyright (c) 2023 - Restate Software, Inc., Restate GmbH
 *
 * This file is part of Restate Examples for the Node.js/TypeScript SDK,
 * which is released under the MIT license.
 *
 * You can find a copy of the license in file LICENSE in the root
 * directory of this repository or package, or at
 * https://github.com/restatedev/examples/blob/main/LICENSE
 */

import * as restate from "@restatedev/restate-sdk";
import * as accounts from "./accounts";

export type Payment = { accountId: string; amount: number };

export type Result = { success: boolean; reason?: string };

// ----------------------------------------------------------------------------
//  Implementation of the payment service
// ----------------------------------------------------------------------------

enum PaymentStatus {
  NEW = 0,
  COMPLETED_SUCCESSFULLY = 1,
  CANCELLED = 2,
}
const EXPIRY_TIMEOUT = 60 * 60 * 1000; // 1 hour

/**
 * RPC handler that processes a payment request.
 * The handler invocation is made idempotent to external clients through the 'idempotencyToken'.
 */
async function makePayment(
  ctx: restate.RpcContext,
  idempotencyToken: string,
  payment: Payment
): Promise<Result> {
  // de-duplication to make calls idempotent
  const status: PaymentStatus = (await ctx.get("status")) ?? PaymentStatus.NEW;
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
    .rpc<accounts.API>({ path: "accounts" })
    .withdraw(accountId, amount);

  // remember only on success, so that on failure (when we didn't charge)  the external
  // caller may retry this (with the same token)
  if (paymentResult.success) {
    ctx.set("status", PaymentStatus.COMPLETED_SUCCESSFULLY);
    ctx.set("payment", payment); // remember this in case we need to roll-back later
    ctx
      .sendDelayed<API>({ path: "payments" }, EXPIRY_TIMEOUT)
      .expireToken(idempotencyToken);
  }

  return paymentResult;
}

async function cancelPayment(
  ctx: restate.RpcContext,
  idempotencyToken: string
) {
  const status: PaymentStatus = (await ctx.get("status")) ?? PaymentStatus.NEW;

  switch (status) {
    case PaymentStatus.NEW:
      // not seen this token before, mark as canceled, in case the cancellation
      // overtook the actual payment request (on the externall caller's side)
      ctx.set("status", PaymentStatus.CANCELLED);
      ctx
        .sendDelayed<API>({ path: "payments" }, EXPIRY_TIMEOUT)
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
      ctx.send<accounts.API>({ path: "accounts" }).deposit(accountId, amount);
      break;
    }
  }
}

async function expireToken(ctx: restate.RpcContext) {
  ctx.clear("status");
  ctx.clear("payment");
}

const rounter = restate.keyedRouter({
  makePayment,
  cancelPayment,
  expireToken,
});

export type API = typeof rounter;

restate
  .createServer()
  .bindKeyedRouter("payments", rounter)
  .bindKeyedRouter("accounts", accounts.router)
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
        { cause: e }
      );
    }
  }
}
