# Combining Sync and Async (Webhook) Responses from Stripe

This example issues a payment request to Stripe.
When calling Stripe, the result often comes synchronously as a response API call. 
But sometimes, an immediate answer is not possible, and especially some payment
methods (like IBAN transfers or Klarna) frequently only return "processing" to notify
you later via a webhook.

This example combines both paths in a single function that reliably waits for both
paths, if needed, thus giving you a single long-running synchronous function.
This is useful, for example, when the payment is processed completely asynchronously,
like during periodic charging of a subscription.

And because we have a durable execution system that suspends and resumes state
and promises, we can actually combine this into a single reliably promise/async-function.

## Running the Example

This example works end-to-end with Stripe. You need a Stripe account to run it.
If you want to run everything locally, you also need a tool like _ngrok_ to forward
webhooks to your local machine.

1. Create a free Stripe test account. This requires no verification, but you can only work
   with test data, not make real payments. Good enough for this example.

2. In the Stripe UI, go to "Developers" -> "API Keys" and copy the _secret key_ (`sk_test_...`).
   Add it to the [stripe_utils.ts](./src/utils/stripe_utils.ts) file. Because this is a dev-only
   API key and it supports only test data, it isn't super sensitive.

3. Start Restate locally (`npx restate-server`).

4. Run this application code here: `npm run app-dev`

5. Connect the apps: `npx restate deployment register localhost:9080`

6. Run launch _ngrok_: Get a free account and download the binary, or launch a docker container.
   Make it forward http calls to local port 8080
   - `NGROK_AUTHTOKEN=<your token> ngrok http 8080`
   - or `docker run --rm -it -e NGROK_AUTHTOKEN=<your token> --network host ngrok/ngrok http 8080` (on Linux command).
   Copy the public URL that ngrok shows you: `https://<some random numbers>.ngrok-free.app`

7. Go to the Stripe UI and create a webhook. Select all _"Payment Intent"_ event types. Put the ngrok
   public URL + `/payments/processWebhook` as the webhook URL (you need to update this whenever you stop/start ngrok).
   Example: `https://<some random numbers>.ngrok-free.app/payments/processWebhooks`

8. Put the webhook secret (`whsec_...`) to the [stripe_utils.ts](./src/utils/stripe_utils.ts) file.

Use as test data `pm_card_visa` for a successful payment and `pm_card_visa_chargeDeclined` for a declined payment.
Because the test data rarely triggers an async response, this example's tools can mimic that
if you add `"delayedStatus": true` to the request.

```shell
curl localhost:8080/payments/processPayment -H 'content-type: application/json' -d '{
        "paymentMethodId": "pm_card_visa",
        "amount": 109,
        "delayedStatus": true
}'
```

A few notes:
* You would usually submit payment calls through Restate also with an idempotency token,
  like: ` -H 'idempotency-key: my-id-token'`
* The webhook setup with ngrok is not trivial and can easily be wrong. You might end up with
  some payments waiting for the webhooks. You can use the CLI to cancel them:
  `npx restate inv list` and `npx restate inv cancel <invocation_id>`.
* Here is an opportunity for the SAGAs pattern to cancel payments in that case.
