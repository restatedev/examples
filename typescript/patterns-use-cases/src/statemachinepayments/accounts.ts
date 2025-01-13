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
export const accountsObject = restate.object({
  name: "accounts",
  handlers: {

    deposit: async (ctx: restate.ObjectContext, amountCents: number) => {
      if (amountCents < 0) {
        throw new restate.TerminalError("Amount must be greater than 0: amount = " + amountCents);
      }

      const balanceCents: number =
        (await ctx.get<number>("balance")) ?? initializeRandomAmount();

      ctx.set("balance", balanceCents + amountCents);
    },

    withdraw: async (
      ctx: restate.ObjectContext,
      amountCents: number
    ): Promise<Result> => {
      if (amountCents < 0) {
        throw new restate.TerminalError("Amount must be greater than 0: amount = " + amountCents);
      }

      const balanceCents =
        (await ctx.get<number>("balance")) ?? initializeRandomAmount();

      if (balanceCents < amountCents) {
        return {
          success: false,
          reason: `Insufficient funds: ${balanceCents} cents`,
        };
      }

      ctx.set("balance", balanceCents - amountCents);
      return { success: true };
    },
  },
});

export type AccountsObject = typeof accountsObject;

// ----------------------------------------------------------------------------
//  miscellaneous utils
// ----------------------------------------------------------------------------

type Result = { success: boolean; reason?: string };

function initializeRandomAmount(): number {
  return Math.floor(Math.random() * 100_000 + 100_000);
}
