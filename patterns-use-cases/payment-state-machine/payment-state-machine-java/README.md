# Simple Payment State Machine

This example shows how to build a reliable payment state machine.

The state machine ensures that payments are processed once, not duplicated,
can be revoked, and that concurrent payment requests and cancellations sort
out consistently.

The example illustrates the following aspects:

- Payment requests use a token to identify payments (stripe-style)
- Restate tracks the status of each payment request by token in internal state.
- A payment can be cancelled, which prevents it from succeeding later, or rolls it back, if
  it was already processed.
- Virtual Object concurrency ensures that requests and cancellations don't produce
  tricky race conditions.
- Expiry of tokens is handled through Restate's internal timers.

Despite the relatively few lines of code (no careful synchronization, retries, or other recovery logic),
this application maintains a high level of consistency in the presence of concurrent external requests
and failures.


## Running this example

Start a Restate Server: `npx restate-server`

Build and start the example
```shell
./gradlew run
```

Register the services: `npx restate dep reg localhost:9080`

Make some requests:

- Make a payment
  ```shell
  curl -X POST localhost:8080/PaymentService/some-string-id/makePayment -H 'content-type: application/json' \
   -d '{  "accountId": "abc", "amountCents": 100 }'
  ```

- Cancel a payment. The 'key' parameter is the idempotency token, there is no further request data.

  ```shell
  curl -X POST localhost:8080/PaymentService/some-string-id/cancelPayment
  ```
