/*
 * Copyright (c) 2024 - Restate Software, Inc., Restate GmbH
 *
 * This file is part of the Restate examples,
 * which is released under the MIT license.
 *
 * You can find a copy of the license in the file LICENSE
 * in the root directory of this repository or package or at
 * https://github.com/restatedev/examples/
 */

import * as restate from "@restatedev/restate-sdk";
import { setTimeout } from "timers/promises";

enum TicketStatus {
  Available,
  Reserved,
  Sold,
}

export const ticketDbRouter = restate.keyedRouter({
  reserve: async (ctx: restate.KeyedContext) => {
    await setTimeout(35000);
    return true;
  },

  unreserve: async (ctx: restate.KeyedContext) => {
    return true;
  },

  markAsSold: async (ctx: restate.KeyedContext) => {
    return true;
  },
});

export const ticketServiceApi: restate.ServiceApi<typeof ticketDbRouter> = {
  path: "TicketService",
};
