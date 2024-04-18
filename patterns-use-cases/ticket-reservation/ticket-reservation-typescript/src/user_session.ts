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
import tickets from "./ticket_db";
import checkout from "./checkout";

const userSession = restate.object({
  name: "UserSession",
  handlers: {
    addTicket: async (ctx: restate.ObjectContext, ticketId: string) => {
      //
      // try to reserve ticket
      //
      const reservation = await ctx.objectClient(TicketDB, ticketId).reserve();

      if (reservation) {
        //
        // add ticket to user session items
        //
        const tickets = (await ctx.get<string[]>("items")) ?? [];
        tickets.push(ticketId);
        ctx.set("items", tickets);

        //
        // Schedule expiry timer
        //
        ctx
          .objectSendClient(UserSession, ctx.key, { delay: 15 * 60 * 1000 })
          .expireTicket(ticketId);
      }

      return reservation;
    },

    expireTicket: async (ctx: restate.ObjectContext, ticketId: string) => {
      const tickets = (await ctx.get<string[]>("items")) ?? [];

      const index = tickets.findIndex((id) => id === ticketId);

      // try removing ticket
      if (index != -1) {
        tickets.splice(index, 1);
        ctx.set("items", tickets);
        //
        // unreserve if ticket was reserved before
        //
        ctx.objectSendClient(TicketDB, ticketId).unreserve();
      }
    },

    checkout: async (ctx: restate.ObjectContext) => {
      const tickets = await ctx.get<string[]>("items");

      if (!tickets || tickets.length == 0) {
        // no tickets reserved
        return false;
      }

      const success = await ctx
        .serviceClient(Checkout)
        .checkout({ userId: ctx.key, tickets: tickets! });

      if (!success) {
        return false;
      }
      //
      // mark items as sold if checkout was successful
      //
      for (const ticketId of tickets) {
        ctx.objectSendClient(TicketDB, ticketId).markAsSold();
      }
      ctx.clear("items");
    },
  },
});

const TicketDB: typeof tickets = { name: "TicketDb" };
const UserSession: typeof userSession = { name: "UserSession" };
const Checkout: typeof checkout = { name: "CheckoutProcess" };

export default userSession;
