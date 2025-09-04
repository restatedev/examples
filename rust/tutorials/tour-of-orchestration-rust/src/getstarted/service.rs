use restate_sdk::{Context, Service, Result, RestateError};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Deserialize)]
struct SubscriptionRequest {
    user_id: String,
    credit_card: String,
    subscriptions: Vec<String>,
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
struct SubscriptionService;

impl SubscriptionService {
    #[restate_sdk::handler]
    async fn add(&self, ctx: &mut Context, req: SubscriptionRequest) -> Result<(), RestateError> {
        let payment_id = ctx.random_uuid().to_string();

        let pay_ref = ctx.run("pay", async move {
            create_recurring_payment(&req.credit_card, &payment_id).await
        }).await?;

        for subscription in req.subscriptions.iter() {
            let subscription = subscription.clone();
            let user_id = req.user_id.clone();
            let pay_ref = pay_ref.clone();
            
            ctx.run(&format!("add-{}", subscription), async move {
                create_subscription(&user_id, &subscription, &pay_ref).await
            }).await?;
        }

        Ok(())
    }
}

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let service = SubscriptionService;
    
    restate_sdk::serve(service)
        .bind("0.0.0.0:9080")
        .await?;
    
    Ok(())
}