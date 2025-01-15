mod stubs;

use crate::stubs::{create_recurring_payment, create_subscription};
use restate_sdk::prelude::*;
use serde::Deserialize;

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SubscriptionRequest {
    pub user_id: String,
    pub credit_card: String,
    pub subscriptions: Vec<String>,
}

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

#[restate_sdk::service]
pub trait SubscriptionService {
    async fn add(req: Json<SubscriptionRequest>) -> Result<(), HandlerError>;
}

struct SubscriptionServiceImpl;

impl SubscriptionService for SubscriptionServiceImpl {
    async fn add(
        &self,
        mut ctx: Context<'_>,
        Json(req): Json<SubscriptionRequest>,
    ) -> Result<(), HandlerError> {
        // Restate persists the result of all `ctx` actions and recovers them after failures
        // For example, generate a stable idempotency key:
        let payment_id = ctx.rand_uuid().to_string();

        // ctx.run persists results of successful actions and skips execution on retries
        // Failed actions (timeouts, API downtime, etc.) get retried
        let pay_ref = ctx
            .run(|| create_recurring_payment(&req.credit_card, &payment_id))
            .await?;

        for subscription in req.subscriptions {
            ctx.run(|| create_subscription(&req.user_id, &subscription, &pay_ref))
                .await?;
        }

        Ok(())
    }
}

// Create an HTTP endpoint to serve your services on port 9080
#[tokio::main]
async fn main() {
    tracing_subscriber::fmt::init();

    HttpServer::new(
        Endpoint::builder()
            .bind(SubscriptionServiceImpl.serve())
            .build(),
    )
    .listen_and_serve("0.0.0.0:9080".parse().unwrap())
    .await;
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
