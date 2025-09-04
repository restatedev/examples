use restate_sdk::{Context, Service, Result, RestateError, TerminalError};
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

// Mock function to remove recurring payment
async fn remove_recurring_payment(payment_id: &str) -> Result<(), RestateError> {
    println!("Removing recurring payment: {}", payment_id);
    Ok(())
}

// Mock function to create subscription
async fn create_subscription(user_id: &str, subscription: &str, payment_ref: &str) -> Result<(), RestateError> {
    println!("Creating subscription for user: {}, subscription: {}, paymentRef: {}", 
             user_id, subscription, payment_ref);
    Ok(())
}

// Mock function to remove subscription
async fn remove_subscription(user_id: &str, subscription: &str) -> Result<(), RestateError> {
    println!("Removing subscription for user: {}, subscription: {}", user_id, subscription);
    Ok(())
}

#[derive(Service)]
struct SubscriptionSaga;

impl SubscriptionSaga {
    #[restate_sdk::handler]
    async fn add(&self, ctx: &mut Context, req: SubscriptionRequest) -> Result<(), RestateError> {
        let mut compensations: Vec<Box<dyn FnOnce() -> Result<(), RestateError> + Send>> = Vec::new();
        
        let payment_id = ctx.random_uuid().to_string();
        
        // Add compensation for payment
        let payment_id_clone = payment_id.clone();
        compensations.push(Box::new(move || {
            // In a real implementation, this would be async
            println!("Compensating payment: {}", payment_id_clone);
            Ok(())
        }));
        
        // Create payment
        let pay_ref = match ctx.run("pay", async move {
            create_recurring_payment(&req.credit_card, &payment_id).await
        }).await {
            Ok(pay_ref) => pay_ref,
            Err(e) => {
                // Run compensations on failure
                for compensation in compensations.into_iter().rev() {
                    let _ = compensation();
                }
                return Err(e);
            }
        };
        
        // Process subscriptions
        let mut processed_subscriptions = Vec::new();
        
        for subscription in req.subscriptions.iter() {
            // Add compensation for this subscription
            let user_id_clone = req.user_id.clone();
            let subscription_clone = subscription.clone();
            compensations.push(Box::new(move || {
                println!("Compensating subscription: {} for user: {}", subscription_clone, user_id_clone);
                Ok(())
            }));
            
            // Create subscription
            match ctx.run(&format!("add-{}", subscription), {
                let user_id = req.user_id.clone();
                let subscription = subscription.clone();
                let pay_ref = pay_ref.clone();
                async move {
                    create_subscription(&user_id, &subscription, &pay_ref).await
                }
            }).await {
                Ok(_) => processed_subscriptions.push(subscription.clone()),
                Err(e) => {
                    // Run compensations in reverse order on failure
                    for compensation in compensations.into_iter().rev() {
                        let _ = compensation();
                    }
                    return Err(e);
                }
            }
        }
        
        Ok(())
    }
}

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let service = SubscriptionSaga;
    
    restate_sdk::serve(service)
        .bind("0.0.0.0:9080")
        .await?;
    
    Ok(())
}