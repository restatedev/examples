/*
 * Copyright (c) 2023 - Restate Software, Inc., Restate GmbH
 *
 * This file is part of the Tour of Restate Typescript handler API,
 * which is released under the MIT license.
 *
 * You can find a copy of the license in the file LICENSE
 * in the root directory of this repository or package or at
 * https://github.com/restatedev/tour-of-restate
 */

import * as restate from "@restatedev/restate-sdk";
import { v4 as uuid } from "uuid";
import { EmailClient } from "../auxiliary/email_client";
import { PaymentClient } from "../auxiliary/payment_client";

const checkout = async (
  ctx: restate.RpcContext,
  request: { userId: string; tickets: string[] },
) => {
  // Generate idempotency key for the stripe client
  const idempotencyKey = await ctx.sideEffect(async () => uuid());

  // We are a uniform shop where everything costs 40 USD
  const totalPrice = request.tickets.length * 40;

  const paymentClient = PaymentClient.get();

  const doPayment = () => paymentClient.failingCall(idempotencyKey, totalPrice);
  const success = await ctx.sideEffect(doPayment);

  const email = EmailClient.get();

  if (success) {
    await ctx.sideEffect( () => email.notifyUserOfPaymentSuccess(request.userId));
  } else {
    await ctx.sideEffect(() => email.notifyUserOfPaymentFailure(request.userId));
  }

  return success;
};

export const checkoutRouter = restate.router({ checkout });

export const checkoutApi: restate.ServiceApi<typeof checkoutRouter> = {
  path: "Checkout",
};
