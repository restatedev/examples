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
import {TicketObject} from "../part1/ticket_object";
import {CheckoutService} from "../part1/checkout_service";

export const cartObject = restate.object({
  name: "CartObject",
  handlers: {
    // <start_add_ticket>
    async addTicket(ctx: restate.ObjectContext, ticketId: string) {
      const reservationSuccess = await ctx.objectClient(TicketObject, ticketId).reserve();

      if (reservationSuccess) {
        // !mark(1,2)
        ctx.objectSendClient(CartObject, ctx.key)
            .expireTicket(ticketId, restate.rpc.sendOpts({ delay: { minutes: 15 } }));
      }

      return reservationSuccess;
    },
    // <end_add_ticket>

    async checkout(ctx: restate.ObjectContext) {
      const success = await ctx.serviceClient(CheckoutService)
          .handle({userId: ctx.key, tickets: ["seat2B"]});

      return success;
    },

    async expireTicket(ctx: restate.ObjectContext, ticketId: string) {
      ctx.objectSendClient(TicketObject, ticketId).unreserve();
    }
  }
});

export const CartObject: typeof cartObject = { name: "CartObject" };
