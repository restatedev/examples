import * as restate from "@restatedev/restate-sdk";
import { service } from "@restatedev/restate-sdk";
import {
  SubscriptionRequest,
  createRecurringPayment,
  createSubscription,
} from "./utils/stubs";

// Restate lets you implement resilient applications.
// Restate ensures handler code runs to completion despite failures:
//  - Automatic retries
//  - Restate tracks the progress of execution, and prevents re-execution of completed work on retries
//  - Regular code and control flow, no custom DSLs

// Applications consist of services with handlers that can be called over HTTP or Kafka.
const subscriptionService = restate.service({
    name: "SubscriptionService",
    // Handlers can be called over HTTP at http://restate:8080/ServiceName/handlerName
    // Restate persists HTTP requests to this handler and manages execution.
    handlers: {
        add: async (ctx: restate.Context, req: SubscriptionRequest) => {
            // Stable idempotency key: Restate persists the result of
            // all `ctx` actions and recovers them after failures
            const paymentId = ctx.rand.uuidv4();

            // Retried in case of timeouts, API downtime, etc.
            const payRef = await ctx.run(() =>
                createRecurringPayment(req.creditCard, paymentId)
            );

            // Persists successful subscriptions and skip them on retries
            for (const subscription of req.subscriptions) {
                await ctx.run(() =>
                    createSubscription(req.userId, subscription, payRef)
                );
            }
        },
    },
})

// Create an HTTP endpoint to serve your services on port 9080
// or use .handler() to run on Lambda, Deno, Bun, Cloudflare Workers, ...
restate
  .endpoint()
  .bind(subscriptionService)
  .listen(9080);

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
