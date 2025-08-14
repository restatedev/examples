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
import { TicketObject } from "./ticket_object";
import { CheckoutService } from "./checkout_service";

// <start_user_session>
export const cartObject = restate.object({
  name: "CartObject",
  handlers: {
    async addTicket(ctx: restate.ObjectContext, ticketId: string) {
      return true;
    },

    async checkout(ctx: restate.ObjectContext) {
      return true;
    },

    async expireTicket(ctx: restate.ObjectContext, ticketId: string) {},
  },
});
// <end_user_session>

export const CartObject: typeof cartObject = { name: "CartObject" };
