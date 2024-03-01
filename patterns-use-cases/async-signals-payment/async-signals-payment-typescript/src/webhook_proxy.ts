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

import express from "express";
import Stripe from "stripe";
import * as stripe_utils from "./utils/stripe_utils";

//
// A simple proxy to receive the webhook calls from Stripe, verify their signature
// and forward them to Restate.
//
// This is a workaround for some limitations of Restate's ingress, in particular the fact
// that Stripe needs an unmodified request body to verify the signature.
// This class would disappear in future versions, when we have raw
//

const app = express();

app.post("/webhooks", express.raw({ type: "application/json" }), async (request, response) => {
  const sig = request.headers["stripe-signature"];
  if (sig === undefined) {
    response.status(400).send("Missing 'stripe-signature' header.");
    return;
  }

  let event;
  try {
    event = stripe_utils.parseWebhookCall(request.body, sig);
  } catch (err) {
    response.status(400).send(`Webhook Error: ${err}`);
    return;
  }

  if (event.type.startsWith("payment_intent")) {
    const paymentIntent = event.data.object as Stripe.PaymentIntent;
    console.log(JSON.stringify(paymentIntent));

    const restateCallbackId = paymentIntent.metadata[stripe_utils.RESTATE_CALLBACK_ID];
    if (!restateCallbackId) {
      response
        .status(404)
        .json({ message: "Missing callback property: " + stripe_utils.RESTATE_CALLBACK_ID });
    }
    await callRestate(restateCallbackId, paymentIntent);
  } else {
    console.log(`Unhandled event type ${event.type}`);
  }

  response.status(200).json({ received: true });
});

app.listen(5050, () => console.log("Express listening at 5050"));

async function callRestate(awakeableId: string, request: object) {
  const url = "http://localhost:8080/dev.restate.Awakeables/Resolve";
  const body = JSON.stringify({
    id: awakeableId,
    json_result: request,
  });

  console.debug(`Making call to Restate at ${url}`);

  const httpResponse = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body,
  });

  const responseText = await httpResponse.text();
  console.log(`HTTP ${httpResponse.status} - ${responseText}`);
}
