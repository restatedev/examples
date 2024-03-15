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
import { checkoutApi } from "./checkout";

export const userSessionRouter = restate.keyedRouter({
  // <start_add_ticket>
  async addTicket(ctx: restate.KeyedContext, userId: string, ticketId: string){
    const reservationSuccess = await ctx.rpc(ticketServiceApi).reserve(ticketId);

    if (reservationSuccess) {
      //highlight-next-line
      const tickets = (await ctx.get<string[]>("tickets")) ?? [];
      tickets.push(ticketId);
      //highlight-next-line
      ctx.set("tickets", tickets);

      ctx.sendDelayed(userSessionApi, 15 * 60 * 1000).expireTicket(userId, ticketId);
    }

    return reservationSuccess;
  },
  // <end_add_ticket>

  // <start_expire_ticket>
  async expireTicket(ctx: restate.KeyedContext, userId: string, ticketId: string){
    const tickets = (await ctx.get<string[]>("tickets")) ?? [];

    const ticketIndex = tickets.findIndex((ticket) => ticket === ticketId);

    if (ticketIndex != -1) {
      tickets.splice(ticketIndex, 1);
      ctx.set("tickets", tickets);

      ctx.send(ticketServiceApi).unreserve(ticketId);
    }
  },
  // <end_expire_ticket>

  // <start_checkout>
  async checkout(ctx: restate.KeyedContext, userId: string){
    //highlight-next-line
    const tickets = (await ctx.get<string[]>("tickets")) ?? [];

    //highlight-start
    if (tickets.length === 0) {
      return false;
    }
    //highlight-end

    const checkoutSuccess = await ctx.rpc(checkoutApi)
        .handle({ userId: userId, tickets: tickets });

    if (checkoutSuccess) {
      ctx.clear("tickets");
    }

    return checkoutSuccess;
  },
  // <end_checkout>
});

export const userSessionApi: restate.ServiceApi<typeof userSessionRouter> = {
  path: "UserSession",
};
