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

import { TerminalError } from "@restatedev/restate-sdk";
import Stripe from "stripe";

const stripeSecretKey = "...";
const webHookSecret = "...";

const stripe = new Stripe(stripeSecretKey, { apiVersion: "2023-10-16" });

export const RESTATE_CALLBACK_ID = "restate_callback_id";

export function parseWebhookCall(requestBody: any, signature: string | string[]) {
    return stripe.webhooks.constructEvent(requestBody, signature, webHookSecret);
}

export async function createPaymentIntent(request: {
    paymentMethodId: string,
    amount: number,
    idempotencyKey: string,
    webhookPromiseId: string,
    delayedStatus?: boolean
}): Promise<Stripe.PaymentIntent> {

    const requestOptions = {
        idempotencyKey: request.idempotencyKey
    }

    try {
        const paymentIntent: Stripe.PaymentIntent = await stripe.paymentIntents.create({
            amount: request.amount,
            currency: "usd",
            payment_method: request.paymentMethodId,
            confirm: true,
            confirmation_method: "automatic",
            return_url: "https://restate.dev/", // some random URL
            metadata: {
                restate_callback_id: request.webhookPromiseId
            }
        }, requestOptions);

        // simulate delayed notifications for testing
        if (request.delayedStatus) {
            paymentIntent.status = "processing";
        }
        return paymentIntent;
    }
    catch (error) {
        if (error instanceof Stripe.errors.StripeCardError) {
            // simulate delayed notifications for testing
            const paymentIntent = error.payment_intent;
            if (request.delayedStatus && paymentIntent) {
                paymentIntent.status = "processing";
                return paymentIntent;
             } else {
                throw new TerminalError(`Payment declined: ${paymentIntent?.status} - ${error.message}`);
             }
        } else {
            throw error;
        }
    }
}