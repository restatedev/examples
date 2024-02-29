/*
 * Copyright (c) 2024 - Restate Software, Inc., Restate GmbH
 *
 * This file is part of the Restate Examples for the Node.js/TypeScript SDK,
 * which is released under the MIT license.
 *
 * You can find a copy of the license in the file LICENSE
 * in the root directory of this repository or package or at
 * https://github.com/restatedev/examples/blob/main/LICENSE
 */

import * as restate from "@restatedev/restate-sdk";

enum TicketStatus {
  Available,
  Reserved,
  Sold,
}

export const ticketDbRouter = restate.keyedRouter({
  reserve: async (ctx: restate.KeyedContext) => {
    const status = (await ctx.get<TicketStatus>("status")) ?? TicketStatus.Available;

    if (status === TicketStatus.Available) {
      ctx.set("status", TicketStatus.Reserved);
      return true;
    } else {
      return false;
    }
  },
  unreserve: async (ctx: restate.KeyedContext) => {
    const status = (await ctx.get<TicketStatus>("status")) ?? TicketStatus.Available;

    if (status === TicketStatus.Sold) {
      return false;
    } else {
      ctx.clear("status");
      return true;
    }
  },
  markAsSold: async (ctx: restate.KeyedContext) => {
    const status = (await ctx.get<TicketStatus>("status")) ?? TicketStatus.Available;

    if (status === TicketStatus.Reserved) {
      ctx.set("status", TicketStatus.Sold);
      return true;
    } else {
      return false;
    }
  },
});

export const ticketDbApi: restate.ServiceApi<typeof ticketDbRouter> = {
  path: "TicketDb",
};
