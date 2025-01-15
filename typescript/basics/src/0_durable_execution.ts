import * as restate from "@restatedev/restate-sdk";
import { service } from "@restatedev/restate-sdk";
import {
  SubscriptionRequest,
  createRecurringPayment,
  createSubscription,
} from "./utils/stubs";

// Restate helps you implement resilient applications:
//  - Automatic retries
//  - Tracking progress of execution and preventing re-execution of completed work on retries
//  - Providing durable building blocks like timers, promises, and messaging: recoverable and revivable anywhere
//
// Applications consist of services with handlers that can be called over HTTP or Kafka.
// Handlers can be called at http://restate:8080/ServiceName/handlerName
//
// Restate persists and proxies HTTP requests to handlers and manages their execution:
//
// ┌────────┐   ┌─────────┐   ┌────────────────────────────┐
// │ HTTP   │ → │ Restate │ → │ Restate Service (with SDK) │
// │ Client │ ← │         │ ← │   handler1(), handler2()   │
// └────────┘   └─────────┘   └────────────────────────────┘
//
// The SDK lets you implement handlers with regular code and control flow.
// Handlers have access to a Context that provides durable building blocks that get persisted in Restate.
// Whenever a handler uses the Restate Context, an event gets persisted in Restate's log.
// After a failure, a retry is triggered and this log gets replayed to recover the state of the handler.

const subscriptionService = restate.service({
    name: "SubscriptionService",
    handlers: {
        add: async (ctx: restate.Context, req: SubscriptionRequest) => {
            // Restate persists the result of all `ctx` actions and recovers them after failures
            // For example, generate a stable idempotency key:
            const paymentId = ctx.rand.uuidv4();

            // ctx.run persists results of successful actions and skips execution on retries
            // Failed actions (timeouts, API downtime, etc.) get retried
            const payRef = await ctx.run(() =>
                createRecurringPayment(req.creditCard, paymentId)
            );

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
