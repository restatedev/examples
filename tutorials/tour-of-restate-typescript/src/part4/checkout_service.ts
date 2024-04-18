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
import { PaymentClient } from "../auxiliary/payment_client";
import { EmailClient } from "../auxiliary/email_client";

export const checkoutService = restate.service({
  name: "CheckoutService",
  handlers: {
    // <start_checkout>
    async handle(ctx: restate.Context, request: { userId: string; tickets: string[] }) {
      const totalPrice = request.tickets.length * 40;

      const idempotencyKey = ctx.rand.uuidv4();
      const success = await ctx.run(() => PaymentClient.get().call(idempotencyKey, totalPrice));

      if (success) {
        await ctx.run(() => EmailClient.get().notifyUserOfPaymentSuccess(request.userId));
      } else {
        await ctx.run(() => EmailClient.get().notifyUserOfPaymentFailure(request.userId));
      }

      return success;
    },
    // <end_checkout>
  }
});

export const CheckoutService: typeof checkoutService = { name: "CheckoutService"};
