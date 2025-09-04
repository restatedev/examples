use restate_sdk::{Context, Service, Result, RestateError};
use serde::{Deserialize, Serialize};
use uuid::Uuid;
use futures::future::join_all;

#[derive(Deserialize)]
struct SubscriptionRequest {
    user_id: String,
    credit_card: String,
    subscriptions: Vec<String>,
}

#[derive(Serialize)]
struct SubscriptionResult {
    success: bool,
    payment_ref: String,
}

// Mock function to create recurring payment
async fn create_recurring_payment(credit_card: &str, payment_id: &str) -> Result<String, RestateError> {
    Ok(format!("payRef-{}", Uuid::new_v4()))
}

// Mock function to create subscription
async fn create_subscription(user_id: &str, subscription: &str, payment_ref: &str) -> Result<(), RestateError> {
    println!("Creating subscription for user: {}, subscription: {}, paymentRef: {}", 
             user_id, subscription, payment_ref);
    Ok(())
}

#[derive(Service)]
struct ParallelSubscriptionService;

impl ParallelSubscriptionService {
    #[restate_sdk::handler]
    async fn add(&self, ctx: &mut Context, req: SubscriptionRequest) -> Result<SubscriptionResult, RestateError> {
        let payment_id = ctx.random_uuid().to_string();
        
        let pay_ref = ctx.run("pay", async move {
            create_recurring_payment(&req.credit_card, &payment_id).await
        }).await?;

        // Start all subscriptions in parallel
        let mut subscription_futures = Vec::new();
        for subscription in req.subscriptions.iter() {
            let subscription = subscription.clone();
            let user_id = req.user_id.clone();
            let pay_ref = pay_ref.clone();
            
            let future = ctx.run_async(&format!("add-{}", subscription), async move {
                create_subscription(&user_id, &subscription, &pay_ref).await
            });
            subscription_futures.push(future);
        }

        // Wait for all subscriptions to complete
        let results = join_all(subscription_futures).await;
        
        // Check if all succeeded
        for result in results {
            result?;
        }

        Ok(SubscriptionResult {
            success: true,
            payment_ref: pay_ref,
        })
    }
}

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let service = ParallelSubscriptionService;
    
    restate_sdk::serve(service)
        .bind("0.0.0.0:9080")
        .await?;
    
    Ok(())
}