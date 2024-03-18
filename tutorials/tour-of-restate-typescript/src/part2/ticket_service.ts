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
// <start_import_sleep>
import { setTimeout } from "timers/promises";
// <end_import_sleep>

enum TicketStatus {
  Available,
  Reserved,
  Sold,
}

export const ticketDbRouter = restate.keyedRouter({
  // <start_reserve>
  async reserve(ctx: restate.KeyedContext){
    //good-code-start
    await ctx.sleep(35000);
    //good-code-end
    return true;
  },
  // <end_reserve>

  async unreserve(ctx: restate.KeyedContext){
    return true;
  },

  async markAsSold(ctx: restate.KeyedContext){
    return true;
  },
});

export const ticketServiceApi: restate.ServiceApi<typeof ticketDbRouter> = {
  path: "TicketService",
};
