package durable_execution;

import dev.restate.sdk.JsonSerdes;
import dev.restate.sdk.Context;
import dev.restate.sdk.annotation.Handler;
import dev.restate.sdk.annotation.Service;
import dev.restate.sdk.http.vertx.RestateHttpEndpointBuilder;
import utils.SubscriptionRequest;

import static utils.ExampleStubs.*;

// Restate lets you implement resilient applications.
// Restate ensures code runs to completion despite failures:
//  - Automatic retries
//  - Restate tracks the progress of execution, and prevents re-execution of completed work on retries
//  - Regular code and control flow, no custom DSLs

// Applications consist of services (`@Service`) with handlers (`@Handler`)
// that can be called over HTTP or Kafka.
@Service
public class SubscriptionService {

    // Handlers can be called at http://restate:8080/ServiceName/handlerName
    // Restate persists HTTP requests to this handler and manages execution.
    @Handler
    public void add(Context ctx, SubscriptionRequest req) {
        // Restate persists the result of all `ctx` actions
        // and recovers them after failures
        var paymentId = ctx.random().nextUUID().toString();

        // Retried in case of timeouts, API downtime, etc.
        var payRef = ctx.run(JsonSerdes.STRING, () ->
                createRecurringPayment(req.creditCard(), paymentId));

        // Persists successful subscriptions and skip them on retries
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
