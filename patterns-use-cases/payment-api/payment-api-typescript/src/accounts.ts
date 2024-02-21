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
import { Result } from "./payment_service";

// ----------------------------------------------------------------------------
//  Simple accounts API that simulates charging the costs
//
//  These handlers run keyed, by the accountId, so we
//  (a) store the state (balance) under that key
//  (b) we are sure that no concurrent modifications are happening to the
//      same accountId
// ----------------------------------------------------------------------------

const error_rate = 0.3; // high error rate, to make it more interesting

async function deposit(
  ctx: restate.RpcContext,
  accountId: string,
  amountCents: number
) {
  if (amountCents < 0) {
    throw new restate.TerminalError("Amount must not be negative");
  }

  const balanceCents: number =
    (await ctx.get<number>("balance")) ?? (await initializeRandomAmount(ctx));
  ctx.set("balance", balanceCents + amountCents);

  console.log(
    `Depositing to account ${accountId}. New balance: $${
      (balanceCents + amountCents) / 100
    }`
  );
}

async function withdraw(
  ctx: restate.RpcContext,
  accountId: string,
  amountCents: number
): Promise<Result> {
  if (amountCents < 0) {
    throw new restate.TerminalError("Amount must not be negative");
  }

  const balanceCents =
    (await ctx.get<number>("balance")) ?? (await initializeRandomAmount(ctx));

  if (balanceCents < amountCents) {
    return { success: false, reason: `balance to low: ${balanceCents} cents` };
  }
  // simulate random rejections
  if (Math.random() < error_rate) {
    return { success: false, reason: "rejected" };
  }

  ctx.set("balance", balanceCents - amountCents);

  console.log(
    `Withdrawing from account ${accountId}. New balance: $${
      Number(balanceCents - amountCents) / 100
    }`
  );

  return { success: true };
}

export const router = restate.keyedRouter({
  deposit,
  withdraw,
});

export type API = typeof router;

// ----------------------------------------------------------------------------
//  miscellaneous utils
// ----------------------------------------------------------------------------

async function initializeRandomAmount(
  ctx: restate.RpcContext
): Promise<number> {
  const amountCents = await ctx.sideEffect(async () =>
    Math.floor(Math.random() * 100_000)
  );
  ctx.set("balance", amountCents);
  return amountCents;
}
