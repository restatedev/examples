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

const stripeSecretKey = "sk_test_...";
const webHookSecret = "whsec_...";

const stripe = new Stripe(stripeSecretKey, { apiVersion: "2023-10-16" });

export const RESTATE_CALLBACK_ID = "restate_callback_id";

export function isPaymentIntent(event: Stripe.Event) {
  return event.type.startsWith("payment_intent");
}

export function parseWebhookCall(
  requestBody: any,
  signature: string | string[] | undefined
) {
  if (!signature) {
    throw new TerminalError("Missing 'stripe-signature' header.", {
      errorCode: 400,
    });
  }
  try {
    return stripe.webhooks.constructEvent(
      requestBody,
      signature,
      webHookSecret
    );
  } catch (err) {
    throw new TerminalError(`Webhook Error: ${err}`, {
      errorCode: 400,
    });
  }
}

export async function createPaymentIntent(request: {
  paymentMethodId: string;
  amount: number;
  idempotencyKey: string;
  intentWebhookId: string;
  delayedStatus?: boolean;
}): Promise<Stripe.PaymentIntent> {
  const requestOptions = {
    idempotencyKey: request.idempotencyKey,
  };

  try {
    const paymentIntent: Stripe.PaymentIntent = await stripe.paymentIntents.create(
      {
        amount: request.amount,
        currency: "usd",
        payment_method: request.paymentMethodId,
        confirm: true,
        confirmation_method: "automatic",
        return_url: "https://restate.dev/", // some random URL
        metadata: {
          restate_callback_id: request.intentWebhookId,
        },
      },
      requestOptions
    );

    // simulate delayed notifications for testing
    if (request.delayedStatus) {
      paymentIntent.status = "processing";
    }
    return paymentIntent;
  } catch (error) {
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
export function ensureSuccess(status: string) {
  switch (status) {
    case "succeeded":
      return;
    case "requires_payment_method":
    case "canceled":
      throw new TerminalError("Payment declined: " + status);
    default:
      throw new Error("Unhandled status: " + status);
  }
}

