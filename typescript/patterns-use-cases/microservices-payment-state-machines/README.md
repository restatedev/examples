# Simple Payment State Machine 

This example shows how to build a reliable payment state machine.

The state machine ensures that payments are processed once, not duplicated,
can be revoked, and that concurrent payment requests and cancellations sort
out consistently.

The example illustrates the following aspects:

- Payment requests use a payment-id (stripe-style)
- The status of each payment-id is maintained in the service (a virtual object) state.
- A payment can be cancelled, which prevents it from succeeding later, or rolls it back, if
  it was already processed.
- Virtual Object concurrency ensures that requests and cancellations don't produce
  race conditions.
- Expiry of tokens is handled through Restate's internal timers.

Despite the relatively few lines of code (no careful synchronization, retries, or other recovery logic),
this application maintains a high level of consistency in the presence of concurrent external requests
and failures.


## Running this example

You need the Restate server binary and the CLI for this example. See [this guide](https://github.com/restatedev/examples/tree/main?tab=readme-ov-file#1-starting-the-restate-server) for details.

Install the dependencies (`npm install`), build and launch the example in a new terminal (`npm run build`, `npm run app`).

Register the services: `restate deployment register "localhost:9080"`

Make some requests:

- Make a payment. The 'my-payment-id' path segment is the unique id for the payment.
  For multiple payments, replace this with different IDs each time.
  ```shell
  curl -X POST localhost:8080/payments/my-payment-id/makePayment -H 'content-type: application/json' \
   -d '{  "accountId": "abc", "amount": 100 }'
  ```

- Cancel a payment

  ```shell
  curl -X POST localhost:8080/payments/my-payment-id/cancelPayment
  ```

Feel free to try and break the semantics with a storm of concurrent requests and restart processes
randomly at some points. Restate will ensure full consistency in all cases.
