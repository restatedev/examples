use restate_sdk::{Context, Service, Result, RestateError, Awakeable};
use serde::{Deserialize, Serialize};
use std::time::Duration;
use uuid::Uuid;
use tokio::time::timeout;

#[derive(Deserialize)]
struct PaymentRequest {
    amount: i32,
    currency: String,
    customer_id: String,
    order_id: String,
}

#[derive(Serialize, Deserialize, Clone)]
struct PaymentResult {
    success: bool,
    transaction_id: Option<String>,
    error_message: Option<String>,
}

#[derive(Deserialize)]
struct ConfirmationRequest {
    id: String,
    result: PaymentResult,
}

// Mock function to initiate payment
async fn init_payment(req: &PaymentRequest, payment_id: &str) -> Result<String, RestateError> {
    println!(">>> Initiating external payment {}", payment_id);
    println!("  Confirm the payment via:");
    println!("  curl localhost:8080/PaymentsWithTimeout/confirm --json '{{\"id\": \"{}\", \"result\": {{\"success\": true, \"transactionId\": \"txn-123\"}}}}'", payment_id);
    Ok(format!("payRef-{}", Uuid::new_v4()))
}

// Mock function to cancel payment
async fn cancel_payment(pay_ref: &str) -> Result<(), RestateError> {
    println!(">>> Canceling external payment with ref {}", pay_ref);
    Ok(())
}

#[derive(Service)]
struct PaymentsWithTimeout;

impl PaymentsWithTimeout {
    #[restate_sdk::handler]
    async fn process(&self, ctx: &mut Context, req: PaymentRequest) -> Result<PaymentResult, RestateError> {
        let confirmation: Awakeable<PaymentResult> = ctx.awakeable();

        let pay_ref = {
            let payment_id = confirmation.id().clone();
            ctx.run("pay", async move {
                init_payment(&req, &payment_id).await
            }).await?
        };

        // Race between payment confirmation and timeout
        match timeout(Duration::from_secs(30), confirmation).await {
            Ok(result) => result,
            Err(_) => {
                // Timeout occurred - cancel the payment
                ctx.run("cancel-payment", async move {
                    cancel_payment(&pay_ref).await
                }).await?;
                
                Ok(PaymentResult {
                    success: false,
                    transaction_id: None,
                    error_message: Some("Payment timeout".to_string()),
                })
            }
        }
    }

    #[restate_sdk::handler]
    async fn confirm(&self, ctx: &mut Context, confirmation: ConfirmationRequest) -> Result<(), RestateError> {
        ctx.resolve_awakeable(&confirmation.id, confirmation.result)?;
        Ok(())
    }
}

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let service = PaymentsWithTimeout;
    
    restate_sdk::serve(service)
        .bind("0.0.0.0:9080")
        .await?;
    
    Ok(())
}