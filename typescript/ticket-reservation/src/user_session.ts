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
import { ticketDbApi } from "./ticket_db";
import { checkoutApi } from "./checkout";

export const userSessionRouter = restate.keyedRouter({
  addTicket: async (
      ctx: restate.RpcContext,
      userId: string,
      ticketId: string
  ) => {
    // try to reserve ticket
    const reservation_response = await ctx.rpc(ticketDbApi).reserve(ticketId);

    if (reservation_response) {
      // add ticket to user session items
      const tickets = (await ctx.get<string[]>("items")) ?? [];
      tickets.push(ticketId);
      ctx.set("items", tickets);

      // Schedule expiry timer
      ctx
          .sendDelayed(userSessionApi, 15 * 60 * 1000)
          .expireTicket(userId, ticketId);
    }

    return reservation_response;
  },
  expireTicket: async (
      ctx: restate.RpcContext,
      userId: string,
      ticketId: string
  ) => {
    ctx.send(ticketDbApi).unreserve(ticketId);
    const tickets = (await ctx.get<string[]>("items")) ?? [];

    const index = tickets.findIndex((id) => id === ticketId);

    // try removing ticket
    if (index != -1) {
      tickets.splice(index, 1);
      ctx.set("items", tickets);
      // unreserve if ticket was reserved before
      ctx.send(ticketDbApi).unreserve(ticketId);
    }
  },
  checkout: async (ctx: restate.RpcContext, userId: string) => {
    const tickets = await ctx.get<string[]>("items");

    if (tickets && tickets.length > 0) {
      const checkout_success = await ctx
          .rpc(checkoutApi)
          .checkout({ userId: userId, tickets: tickets! });

      if (checkout_success) {
        // mark items as sold if checkout was successful
        for (const ticket_id of tickets) {
          ctx.send(ticketDbApi).markAsSold(ticket_id);
        }
        ctx.clear("items");
      }

      return checkout_success;
    } else {
      // no tickets reserved
      return false;
    }
  },
});

export const userSessionApi: restate.ServiceApi<typeof userSessionRouter> = {
  path: "UserSession",
};
