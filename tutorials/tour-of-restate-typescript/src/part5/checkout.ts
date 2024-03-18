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
import { v4 as uuid } from "uuid";
import { EmailClient } from "../auxiliary/email_client";
import { PaymentClient } from "../auxiliary/payment_client";

export const checkoutRouter = restate.router({
  async handle(ctx: restate.Context, request: { userId: string; tickets: string[] }){
    const totalPrice = request.tickets.length * 40;

    const idempotencyKey = await ctx.sideEffect(async () => uuid());

    // <start_failing_client>
    //highlight-start
    const doPayment = () => PaymentClient.get().failingCall(idempotencyKey, totalPrice);
    const success = await ctx.sideEffect(doPayment);
    //highlight-end
    // <end_failing_client>

    if (success) {
      await ctx.sideEffect(() =>
        EmailClient.get().notifyUserOfPaymentSuccess(request.userId),
      );
    } else {
      await ctx.sideEffect(() =>
        EmailClient.get().notifyUserOfPaymentFailure(request.userId),
      );
    }

    return success;
  },
});

export const checkoutApi: restate.ServiceApi<typeof checkoutRouter> = {
  path: "Checkout",
};
