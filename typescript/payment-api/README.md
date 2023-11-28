# Simple Stripe-style Payment API with Restate

This example shows how to build a reliable and consistent Stripe-style payment API with [Restate](https://restate.dev/).

The payment API ensures that payments are reliably processed, not duplicated, can be revoked,
and that concurrent payment requests and cancellations sort out consistently.

The example illustrates the following aspects:

- Payment requests use an idempotency-token to identify payments (stripe-style)
- Restate tracks the status of each payment request by idempotency-token in internal state.
- Updates to the status of each payment request and processing of accounts are kept consistent with
  each other through the combination of durable RPC and durable execution.
- A payment request can be cancelled, which prevents it from succeeding later, or rolles it back, if
  it was already processed.
- Keyed-concurrency ensures that requests and cancellations don't produce tricky race conditions
- Expiry of idempotency-tokens is handled through Restate's internal timers.

Despite the relatively few lines of code (no careful synchronization, retries, or other recovery logic),
this application maintaines a high level of consistency in the presence of concurrent external requests
and failures.

## Running this example

### Prerequisites

- Latest stable version of [NodeJS](https://nodejs.org/en/) >= v18.17.1 and [npm CLI](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm) >= 9.6.7 installed.
- [Docker Engine](https://docs.docker.com/engine/install/) to launch the Restate runtime (not needed for the app implementation itself).

Build and start the example services

```shell
npm install
npm run build
npm run app
```

Now [launch the runtime](../../README.md#launching-the-runtime) and [discover the services](../../README.md#connect-runtime-and-services).

Make a sample payment. The 'key' parameter is the idempotency token.

```shell
curl -X POST localhost:8080/payments/makePayment -H 'content-type: application/json' -d '{"key": "some-string-id", "request": { "accountId": "abc", "amount": 100 } }'
```

Cancel a payment. The 'key' parameter is the idempotency token, there is no further request data.

```shell
curl -X POST localhost:8080/payments/cancelPayment -H 'content-type: application/json' -d '{"key": "some-string-id"}'
```
