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
    amount: number,
    paymentMethodId: string
    delayedStatus?: boolean
}

async function processPayment(ctx: restate.Context, request: PaymentRequest) {
    verifyPaymentRequest(request);

    // generate a deterministic idempotency key
    const idempotencyKey = ctx.rand.uuidv4();

    // initiate a listener for external calls for potential webhook callbacks 
    const webhookPromise = ctx.awakeable<Stripe.PaymentIntent>();

    // make a synchronous call to the payment service
    let paymentIntent = await ctx.sideEffect(() =>
        stripe_utils.createPaymentIntent({
            paymentMethodId: request.paymentMethodId,
            amount: request.amount,
            idempotencyKey,
            webhookPromiseId: webhookPromise.id,
            delayedStatus: request.delayedStatus
        })
    );

    // wait for the webhook call if we don't immediately get a response
    if (paymentIntent.status === "processing") {
        console.log(`Synchronous response for ${idempotencyKey} yielded 'processing', awaiting webhook call...`);

        paymentIntent = await webhookPromise.promise;
        
        console.log(`Webhook call for ${idempotencyKey} received!`);
    } else {
        console.log(`Request ${idempotencyKey} was processed synchronously!`);
    }

    switch (paymentIntent.status) {
        case "succeeded":
            return;
        case "requires_payment_method":
        case "canceled":
            throw new restate.TerminalError("Payment declined: " + paymentIntent.status);
        default:
            throw new Error("Unhandled status: " + paymentIntent.status);
    }
}

restate.endpoint()
    .bindRouter("payments", restate.router({ processPayment }))
    .listen(9080);
