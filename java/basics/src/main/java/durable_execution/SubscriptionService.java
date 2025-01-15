package durable_execution;

import dev.restate.sdk.JsonSerdes;
import dev.restate.sdk.Context;
import dev.restate.sdk.annotation.Handler;
import dev.restate.sdk.annotation.Service;
import dev.restate.sdk.http.vertx.RestateHttpEndpointBuilder;
import utils.SubscriptionRequest;

import static utils.ExampleStubs.*;

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

@Service
public class SubscriptionService {

    @Handler
    public void add(Context ctx, SubscriptionRequest req) {
        // Restate persists the result of all `ctx` actions and recovers them after failures
        // For example, generate a stable idempotency key:
        var paymentId = ctx.random().nextUUID().toString();

        // ctx.run persists results of successful actions and skips execution on retries
        // Failed actions (timeouts, API downtime, etc.) get retried
        var payRef = ctx.run(JsonSerdes.STRING, () ->
                createRecurringPayment(req.creditCard(), paymentId));

        for (String subscription : req.subscriptions()) {
            ctx.run(() -> createSubscription(req.userId(), subscription, payRef));
        }
    }

    public static void main(String[] args) {
        // Create an HTTP endpoint to serve your services
        RestateHttpEndpointBuilder.builder()
                .bind(new SubscriptionService())
                .buildAndListen();
    }
}

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
