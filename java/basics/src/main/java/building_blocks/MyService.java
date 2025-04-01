package building_blocks;

import dev.restate.sdk.Context;
import dev.restate.sdk.annotation.Handler;
import dev.restate.sdk.annotation.Service;
import dev.restate.sdk.endpoint.Endpoint;
import dev.restate.sdk.http.vertx.RestateHttpServer;
import virtual_objects.GreeterObjectClient;

import java.time.Duration;
import java.util.UUID;

import static utils.ExampleStubs.chargeBankAccount;

/*
 * RESTATE's DURABLE BUILDING BLOCKS
 *
 * Restate turns familiar programming constructs into recoverable, distributed building blocks.
 * They get persisted in Restate, survive failures, and can be revived on another process.
 *
 * No more need for retry/recovery logic, K/V stores, workflow orchestrators,
 * scheduler services, message queues, ...
 *
 * The run handler below shows a catalog of these building blocks.
 * Look at the other examples in this project to see how to use them in examples.
 */

@Service
public class MyService {

    // This handler can be called over HTTP at http://restate:8080/MyService/handlerName
    // Use the context to access Restate's durable building blocks
    @Handler
    public void run(Context ctx) throws Exception {
        // 1. IDEMPOTENCY: Add an idempotency key to the header of your requests
        // Restate deduplicates calls automatically. Nothing to do here.

        // 2. DURABLE RPC: Call other services without manual retry and deduplication logic
        // Restate persists all requests and ensures execution till completion
        String result = GreeterObjectClient.fromContext(ctx, "my-obj-key").greet("hello").await();

        // 3. DURABLE MESSAGING: send (delayed) messages to other services without deploying a message broker
        // Restate persists the timers and triggers execution
        GreeterObjectClient.fromContext(ctx, "my-obj-key").send().greet("hello");

        // 4. DURABLE PROMISES: tracked by Restate, can be moved between processes and survive failures
        // Awakeables: block the workflow until notified by another handler
        var awakeable = ctx.awakeable(String.class);
        // Wait on the promise
        // If the process crashes while waiting, Restate will recover the promise somewhere else
        String greeting = awakeable.await();
        // Another process can resolve the awakeable via its ID
        ctx.awakeableHandle(awakeable.id()).resolve(String.class, "hello");

        // 5. DURABLE TIMERS: sleep or wait for a timeout, tracked by Restate and recoverable
        // When this runs on FaaS, the handler suspends and the timer is tracked by Restate
        // Example of durable recoverable sleep
        // If the service crashes two seconds later, Restate will invoke it after another 3 seconds
        ctx.sleep(Duration.ofSeconds(5));
        // Example of waiting on a promise (call/awakeable/...) or a timeout
        awakeable.await(Duration.ofSeconds(5000));
        // Example of scheduling a handler for later on
        GreeterObjectClient.fromContext(ctx, "my-obj-key").send(Duration.ofDays(1)).ungreet();

        // 7. PERSIST RESULTS: avoid re-execution of actions on retries
        // Use this for non-deterministic actions or interaction with APIs, DBs, ...
        // For example, generate idempotency keys that are stable across retries
        // Then use these to call other APIs and let them deduplicate
        String paymentDeduplicationID = UUID.randomUUID().toString();
        ctx.run(() -> chargeBankAccount(paymentDeduplicationID, 100));
    }

    public static void main(String[] args) {
        RestateHttpServer.listen(Endpoint.bind(new MyService()));
    }
}