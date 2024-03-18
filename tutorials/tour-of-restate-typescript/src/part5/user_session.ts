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
  async addTicket(ctx: restate.KeyedContext, userId: string, ticketId: string){
    const reservation_success = await ctx.rpc(ticketServiceApi).reserve(ticketId);

    if (reservation_success) {
      const tickets = (await ctx.get<string[]>("tickets")) ?? [];
      tickets.push(ticketId);
      ctx.set("tickets", tickets);

      ctx
        .sendDelayed(userSessionApi, 15 * 60 * 1000)
        .expireTicket(userId, ticketId);
    }

    return reservation_success;
  },

  async expireTicket(ctx: restate.KeyedContext, userId: string, ticketId: string){
    const tickets = (await ctx.get<string[]>("tickets")) ?? [];

    const index = tickets.findIndex((id) => id === ticketId);

    if (index != -1) {
      tickets.splice(index, 1);
      ctx.set("tickets", tickets);
      ctx.send(ticketServiceApi).unreserve(ticketId);
    }
  },

  async checkout(ctx: restate.KeyedContext, userId: string){
    const tickets = (await ctx.get<string[]>("tickets")) ?? [];

    if (tickets.length === 0) {
      return false;
    }

    const checkoutSuccess = await ctx
      .rpc(checkoutApi)
      .handle({ userId: userId, tickets: tickets! });

    if (checkoutSuccess) {
      for (const ticketId of tickets) {
        ctx.send(ticketServiceApi).markAsSold(ticketId);
      }
      ctx.clear("tickets");
    }

    return checkoutSuccess;
  },
});

export const userSessionApi: restate.ServiceApi<typeof userSessionRouter> = {
  path: "UserSession",
};
