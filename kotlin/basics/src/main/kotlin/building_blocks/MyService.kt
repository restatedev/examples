package building_blocks

import dev.restate.sdk.kotlin.*
import dev.restate.sdk.annotation.Handler
import dev.restate.sdk.annotation.Service
import dev.restate.sdk.http.vertx.RestateHttpEndpointBuilder
import dev.restate.sdk.kotlin.Context
import utils.SubscriptionService
import utils.SubscriptionServiceClient
import utils.chargeBankAccount
import java.util.UUID
import kotlin.time.Duration.Companion.days
import kotlin.time.Duration.Companion.seconds

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
class MyService {

    // This handler can be called over HTTP at http://restate:8080/MyService/handlerName
    // Use the context to access Restate's durable building blocks
    @Handler
    suspend fun run(ctx: Context) {
        // 1. IDEMPOTENCY: Add an idempotency key to the header of your requests
        // Restate deduplicates calls automatically. Nothing to do here.

        // 2. DURABLE RPC: Call other services without manual retry and deduplication logic
        // Restate persists all requests and ensures execution till completion
        val result = SubscriptionServiceClient.fromContext(ctx, "my-sub-123").create("my-request").await()

        // 3. DURABLE MESSAGING: send (delayed) messages to other services without deploying a message broker
        // Restate persists the timers and triggers execution
        SubscriptionServiceClient.fromContext(ctx, "my-sub-123").send().create("my-request")

        // 4. DURABLE PROMISES: tracked by Restate, can be moved between processes and survive failures
        // Awakeables: block the workflow until notified by another handler
        val awakeable = ctx.awakeable<String>()
        // Wait on the promise
        // If the process crashes while waiting, Restate will recover the promise somewhere else
        val greeting = awakeable.await()
        // Another process can resolve the awakeable via its ID
        ctx.awakeableHandle(awakeable.id).resolve("hello")

        // 5. DURABLE TIMERS: sleep or wait for a timeout, tracked by Restate and recoverable
        // When this runs on FaaS, the handler suspends and the timer is tracked by Restate
        // Example of durable recoverable sleep
        // If the service crashes two seconds later, Restate will invoke it after another 3 seconds
        ctx.sleep(5.seconds)
        // Example of waiting on a promise (call/awakeable/...) or a timeout
        val timeout = ctx.timer(5.seconds)
        Awaitable.any(awakeable, timeout).await()
        // Example of scheduling a handler for later on
        SubscriptionServiceClient.fromContext(ctx, "my-sub-123").send(1.days).cancel()

        // 7. PERSIST RESULTS: avoid re-execution of actions on retries
        // Use this for non-deterministic actions or interaction with APIs, DBs, ...
        // For example, generate idempotency keys that are stable across retries
        // Then use these to call other APIs and let them deduplicate
        val paymentDeduplicationID = UUID.randomUUID().toString()
        ctx.runBlock { chargeBankAccount(paymentDeduplicationID, 100) }
    }
}

fun main() {
    RestateHttpEndpointBuilder.builder()
        .bind(MyService())
        .bind(SubscriptionService())
        .buildAndListen()
}