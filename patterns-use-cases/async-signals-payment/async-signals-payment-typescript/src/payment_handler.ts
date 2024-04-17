/*
 * Copyright (c) 2024 - Restate Software, Inc., Restate GmbH
 *
 * This file is part of the Restate SDK for Node.js/TypeScript,
 * which is released under the MIT license.
 *
 * You can find a copy of the license in file LICENSE in the root
 * directory of this repository or package, or at
 * https://github.com/restatedev/sdk-typescript/blob/main/LICENSE
 */

import * as restate from "@restatedev/restate-sdk";
import * as stripe_utils from "./utils/stripe_utils";
import { verifyPaymentRequest } from "./utils/utils";
import Stripe from "stripe";

//
// The payment handler that issues calls to Stripe.
//  - the result often comes synchronously as a response API call.
//  - some requests (and some payment methods) only return "processing" and
//    notify later via a webhook.
//
// This example combines both paths in a single function that reliably waits for both
// paths, if needed, thus giving you a single long-running synchronous function.
// Durable execution and the persistent awakeable promises combine this into a single
// reliably promise/async-function.
//
// See README on how to run this example (needs a Stripe test account).
//

type PaymentRequest = {
  amount: number;
  paymentMethodId: string;
  delayedStatus?: boolean;
};

async function processPayment(ctx: restate.Context, request: PaymentRequest) {
  verifyPaymentRequest(request);

  // generate a deterministic idempotency key
  const idempotencyKey = ctx.rand.uuidv4();

  // initiate a listener for external calls for potential webhook callbacks
  const webhookPromise = ctx.awakeable<Stripe.PaymentIntent>();

  // make a synchronous call to the payment service
  const paymentIntent = await ctx.run("stripe call", () =>
    stripe_utils.createPaymentIntent({
      paymentMethodId: request.paymentMethodId,
      amount: request.amount,
      idempotencyKey,
      webhookPromiseId: webhookPromise.id,
      delayedStatus: request.delayedStatus,
    })
  );

  if (paymentIntent.status !== "processing") {
    // the synchros call to stripe had already been completed.
    // That was fast :)
    ctx.console.log(`Request ${idempotencyKey} was processed synchronously!`);
    stripe_utils.ensureSuccess(paymentIntent.status);
    return;
  }

  // We did not get the response on the synchros path, talking to stripe.
  // No worries, stripe will let us know when it is done processing via a webhook.
  // 
  //
  ctx.console.log(
    `Synchronous response for ${idempotencyKey} yielded 'processing', awaiting webhook call...`
  );

  //
  // We will now wait for the webhook call to complete this promise.
  // Check out the handler below.
  // 
  const processedPaymentIntent = await webhookPromise.promise;

  console.log(`Webhook call for ${idempotencyKey} received!`);
  stripe_utils.ensureSuccess(processedPaymentIntent.status);
}

async function processWebhook(ctx: restate.Context) {
  const req = ctx.request();
  const sig = req.headers.get("stripe-signature");
  const event = stripe_utils.parseWebhookCall(req.body, sig);

  if (!stripe_utils.isPaymentIntent(event)) {
    ctx.console.log(`Unhandled event type ${event.type}`);
    return { received: true };
  }

  const paymentIntent = event.data.object as Stripe.PaymentIntent;
  ctx.console.log(JSON.stringify(paymentIntent));

  const webhookPromise =
    paymentIntent.metadata[stripe_utils.RESTATE_CALLBACK_ID];
  if (!webhookPromise) {
    throw new restate.TerminalError(
      "Missing callback property: " + stripe_utils.RESTATE_CALLBACK_ID,
      { errorCode: 404 }
    );
  }
  ctx.resolveAwakeable(webhookPromise, paymentIntent);
  return { received: true };
}

restate.endpoint().bind(restate.service({name: "payments", handlers: { processPayment, processWebhook }})).listen(9080);
