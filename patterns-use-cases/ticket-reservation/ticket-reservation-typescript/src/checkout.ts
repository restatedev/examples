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
import { StripeClient } from "./auxiliary/stripe_client";
import { EmailClient } from "./auxiliary/email_client";

export default restate.service({
  name: "CheckoutProcess",
  handlers: {
    checkout: async (
      ctx: restate.Context,
      request: { userId: string; tickets: string[] }
    ) => {
      // We are a uniform shop where everything costs 40 USD
      const totalPrice = request.tickets.length * 40;

      // Generate idempotency key for the stripe client
      const idempotencyKey = ctx.rand.uuidv4();

      const { paymentSuccess } = await ctx.run("do payment", () => {
        const stripe = StripeClient.get();
        return stripe.call(idempotencyKey, totalPrice);
      });

      const email = EmailClient.get();

      if (paymentSuccess) {
        ctx.console.info("Payment successful. Notifying user about shipment.");
        await ctx.run(() => email.notifyUserOfPaymentSuccess(request.userId));
      } else {
        ctx.console.info("Payment failure. Notifying user about it.");
        await ctx.run(() => email.notifyUserOfPaymentFailure(request.userId));
      }

      return paymentSuccess;
    },
  },
});
