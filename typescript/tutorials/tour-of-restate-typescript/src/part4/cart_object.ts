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
import { TicketObject } from "../part1/ticket_object";
import { CheckoutService } from "../part1/checkout_service";

export const cartObject = restate.object({
  name: "CartObject",
  handlers: {
    async addTicket(ctx: restate.ObjectContext, ticketId: string) {
      const reservationSuccess = await ctx.objectClient(TicketObject, ticketId).reserve();

      if (reservationSuccess) {
        const tickets = (await ctx.get<string[]>("tickets")) ?? [];
        tickets.push(ticketId);
        ctx.set("tickets", tickets);

        ctx
          .objectSendClient(CartObject, ctx.key)
          .expireTicket(ticketId, restate.rpc.sendOpts({ delay: { minutes: 15 } }));
      }

      return reservationSuccess;
    },

    // <start_checkout>
    async checkout(ctx: restate.ObjectContext) {
      const tickets = (await ctx.get<string[]>("tickets")) ?? [];

      if (tickets.length === 0) {
        return false;
      }

      const success = await ctx.serviceClient(CheckoutService).handle({ userId: ctx.key, tickets });

      if (success) {
        // !mark(1:3)
        for (const ticketId of tickets) {
          ctx.objectSendClient(TicketObject, ticketId).markAsSold();
        }
        ctx.clear("tickets");
      }

      return success;
    },
    // <end_checkout>

    async expireTicket(ctx: restate.ObjectContext, ticketId: string) {
      const tickets = (await ctx.get<string[]>("tickets")) ?? [];

      const ticketIndex = tickets.findIndex((ticket) => ticket === ticketId);

      if (ticketIndex != -1) {
        tickets.splice(ticketIndex, 1);
        ctx.set("tickets", tickets);

        ctx.objectSendClient(TicketObject, ticketId).unreserve();
      }
    },
  },
});

export const CartObject: typeof cartObject = { name: "CartObject" };
