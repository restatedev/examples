import * as restate from "@restatedev/restate-sdk";
import { service } from "@restatedev/restate-sdk";
import {
  SubscriptionRequest,
  createRecurringPayment,
  createSubscription,
} from "./utils/stubs";

// Restate lets you implement resilient applications.
// Applications consist of services with handlers/functions that can be called over HTTP or Kafka.
//
// Restate ensures handler code runs to completion despite failures:
//  - Automatic retries
//  - Restate tracks the progress of execution, and prevents re-execution of completed work on retries
//  - Regular code and control flow, no custom DSLs
//
// For example, you can use this to update multiple downstream systems in a single transaction.
// The example implements a service that creates a recurring payment and multiple subscriptions for movie services.

// Implement an HTTP endpoint to serve your services.
restate
  .endpoint()
  .bind(
    // Bind services to the endpoint
    service({
      name: "SubscriptionService",
      // Handlers can be called over HTTP at http://restate:8080/ServiceName/handlerName
      // Restate persists HTTP requests to this handler and manages execution.
      handlers: {
        add: async (ctx: restate.Context, req: SubscriptionRequest) => {
          // Parameters are durable across retries
          const { userId, creditCard, subscriptions } = req;

          // 1. Generate an idempotency key
          // This value is retained after a failure
          const paymentId = ctx.rand.uuidv4();

          // 2. Create a recurring payment via API call
          // Retried in case of timeouts, API downtime, etc.
          const { success } = await ctx.run(() =>
            createRecurringPayment(userId, creditCard, paymentId),
          );
          if (!success) {
            return;
          }

          // 3. Create subscriptions via API calls
          // Persists successful subscriptions and skip them on retries
          for (const subscription of subscriptions) {
            await ctx.run(() => createSubscription(userId, subscription));
          }
        },
      },
    }),
  )
  .listen(9080);
// serve the handlers in a long-running process on port 9080
// or use .handler() to run on Lambda, Deno, Bun, Cloudflare Workers, ...

/*
Check the README to learn how to run Restate.
Then invoke this function and see in the log how it recovers.
Each action (e.g. "created recurring payment") is only logged once across all retries.
Retries did not re-execute the successful operations.

curl localhost:8080/SubscriptionService/add -H 'content-type: application/json' -d \
'{
    "userId": "Sam Beckett",
    "creditCard": "1234-5678-9012-3456",
    "subscriptions" : ["Netflix", "Disney+", "HBO Max"]
}'
*/
