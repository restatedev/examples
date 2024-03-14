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
    //bad-code-start
    await setTimeout(35000);
    //bad-code-end
    return true;
  },
  // <end_reserve>

  // <start_unreserve>
  async unreserve(ctx: restate.KeyedContext){
    return true;
  },
  // <end_unreserve>

  // <start_mark_as_sold>
  async markAsSold(ctx: restate.KeyedContext){
    return true;
  },
  // <end_mark_as_sold>
});

export const ticketServiceApi: restate.ServiceApi<typeof ticketDbRouter> = {
  path: "TicketService",
};
