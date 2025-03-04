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
import {TicketObject} from "./ticket_object";
import {CheckoutService} from "./checkout_service";

export const cartObject = restate.object({
  name: "CartObject",
  handlers: {
    // <start_add_ticket>
    async addTicket(ctx: restate.ObjectContext, ticketId: string) {
      // !mark
      const reservationSuccess = await ctx.objectClient(TicketObject, ticketId).reserve();

      return true;
    },
    // <end_add_ticket>

    // <start_checkout>
    async checkout(ctx: restate.ObjectContext) {
      // !mark(1:2)
      const success = await ctx.serviceClient(CheckoutService)
          .handle({userId: ctx.key, tickets: ["seat2B"]});

      return success;
    },
    // <end_checkout>

    // <start_expire_ticket>
    async expireTicket(ctx: restate.ObjectContext, ticketId: string) {
      // !mark
      ctx.objectSendClient(TicketObject, ticketId).unreserve();
    },
    // <end_expire_ticket>
  }
});

// <start_user_session_api>
export const CartObject: typeof cartObject = { name: "CartObject" };
// <end_user_session_api>