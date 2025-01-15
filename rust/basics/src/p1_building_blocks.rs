mod stubs;

use crate::stubs::{charge_bank_account, SubscriptionServiceClient};
use restate_sdk::prelude::*;
use std::time::Duration;

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
#[restate_sdk::service]
trait MyService {
    async fn run() -> Result<(), HandlerError>;
}

struct MyServiceImpl;

impl MyService for MyServiceImpl {
    // This handler can be called over HTTP at http://restate:8080/myService/handlerName
    // Use the context to access Restate's durable building blocks
    async fn run(&self, mut ctx: Context<'_>) -> Result<(), HandlerError> {
        // ---
        // 1. IDEMPOTENCY: Add an idempotency key to the header of your requests
        // Restate deduplicates calls automatically. Nothing to do here.

        // ---
        // 2. DURABLE RPC: Call other services without manual retry and deduplication logic
        // Restate persists all requests and ensures execution till completion
        let result = ctx
            .object_client::<SubscriptionServiceClient>("my-sub-123")
            .create("my-request".to_string())
            .call()
            .await?;

        // ---
        // 3. DURABLE MESSAGING: send (delayed) messages to other services without deploying a message broker
        // Restate persists the timers and triggers execution
        ctx.object_client::<SubscriptionServiceClient>("my-sub-123")
            .create(String::from("my-request"))
            .send();

        // ---
        // 4. DURABLE PROMISES: tracked by Restate, can be moved between processes and survive failures
        // Awakeables: block the workflow until notified by another handler
        let (id, promise) = ctx.awakeable::<String>();
        // Wait on the promise
        // If the process crashes while waiting, Restate will recover the promise somewhere else
        promise.await?;
        // Another process can resolve the awakeable via its ID
        ctx.resolve_awakeable(&id, String::from("hello"));

        // ---
        // 5. DURABLE TIMERS: sleep or wait for a timeout, tracked by Restate and recoverable
        // When this runs on FaaS, the handler suspends and the timer is tracked by Restate
        // Example of durable recoverable sleep
        // If the service crashes two seconds later, Restate will invoke it after another 3 seconds
        ctx.sleep(Duration::from_secs(5)).await?;
        // Example of scheduling a handler for later on
        ctx.object_client::<SubscriptionServiceClient>("my-sub-123")
            .cancel()
            .send_with_delay(Duration::from_secs(5));

        // ---
        // 7. PERSIST RESULTS: avoid re-execution of actions on retries
        // Use this for non-deterministic actions or interaction with APIs, DBs, ...
        // For example, generate idempotency keys that are stable across retries
        // Then use these to call other APIs and let them deduplicate
        let payment_deduplication_id = ctx.rand_uuid().to_string();
        ctx.run(|| charge_bank_account(&payment_deduplication_id, &100.0))
            .await?;

        Ok(())
    }
}

#[tokio::main]
async fn main() {
    tracing_subscriber::fmt::init();

    HttpServer::new(Endpoint::builder().bind(MyServiceImpl.serve()).build())
        .listen_and_serve("0.0.0.0:9080".parse().unwrap())
        .await;
}
