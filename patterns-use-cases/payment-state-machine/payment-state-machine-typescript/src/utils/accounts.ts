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

//
// A simple virtual object, to track accounts.
// This is for simplicity to make this example work self-contained.
// This should be a database in a real scenario
//

type Result = { success: boolean; reason?: string };

export const userAccountObjects = restate.keyedRouter({
  deposit: async (ctx: restate.KeyedContext, accountId: string, amountCents: number) => {
    if (amountCents < 0) {
      throw new restate.TerminalError("Amount must not be negative");
    }

    const balanceCents: number = (await ctx.get<number>("balance")) ?? initializeRandomAmount();
    ctx.set("balance", balanceCents + amountCents);
  },

  withdraw: async (
    ctx: restate.KeyedContext,
    accountId: string,
    amountCents: number
  ): Promise<Result> => {
    if (amountCents < 0) {
      throw new restate.TerminalError("Amount must not be negative");
    }

    const balanceCents = (await ctx.get<number>("balance")) ?? initializeRandomAmount();

    if (balanceCents < amountCents) {
      return {
        success: false,
        reason: `balance to low: ${balanceCents} cents`,
      };
    }

    ctx.set("balance", balanceCents - amountCents);
    return { success: true };
  },
});

export type Api = typeof userAccountObjects;
export const api: restate.ServiceApi<Api> = { path: "accounts" };

// ----------------------------------------------------------------------------
//  miscellaneous utils
// ----------------------------------------------------------------------------

function initializeRandomAmount(): number {
  return Math.floor(Math.random() * 100_000 + 100_000);
}
