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
import { ticketServiceApi } from "./ticket_service";
// <start_checkout_api_import>
import { checkoutApi } from "./checkout";
// <end_checkout_api_import>

export const userSessionRouter = restate.keyedRouter({
  // <start_add_ticket>
  async addTicket(ctx: restate.KeyedContext, userId: string, ticketId: string){
    // highlight-start
    ctx.send(ticketServiceApi).reserve(ticketId);
    // highlight-end
    return true;
  },
  // <end_add_ticket>

  // <start_checkout>
  async checkout(ctx: restate.KeyedContext, userId: string) {
    //highlight-start
    const checkoutRequest = { userId: userId, tickets: ["456"] };
    const success = await ctx.rpc(checkoutApi).handle(checkoutRequest);
    //highlight-end

    return success;
  },
  // <end_checkout>

  // <start_expire_ticket>
  async expireTicket(ctx: restate.KeyedContext, userId: string, ticketId: string){
    // highlight-start
    ctx.send(ticketServiceApi).unreserve(ticketId);
    // highlight-end
  }
  // <end_expire_ticket>
});

export const userSessionApi: restate.ServiceApi<typeof userSessionRouter> = {
  path: "UserSession",
};
