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

// <start_checkout>
export const checkoutRouter = restate.router({
  async handle(ctx: restate.Context, request: { userId: string; tickets: string[] }){
    // <start_side_effects>
    const totalPrice = request.tickets.length * 40;

    // highlight-start
    const idempotencyKey = ctx.rand.uuidv4();
    const success = await ctx.sideEffect(() => PaymentClient.get().call(idempotencyKey, totalPrice));
    // highlight-end
    // <end_side_effects>

    if (success) {
      await ctx.sideEffect(() => EmailClient.get().notifyUserOfPaymentSuccess(request.userId));
    } else {
      await ctx.sideEffect(() => EmailClient.get().notifyUserOfPaymentFailure(request.userId));
    }

    return success;
  },
});
// <end_checkout>

export const checkoutApi: restate.ServiceApi<typeof checkoutRouter> = {
  path: "Checkout",
};
