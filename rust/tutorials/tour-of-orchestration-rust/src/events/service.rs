use restate_sdk::{Context, Service, Result, RestateError, Awakeable};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

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
    println!("  curl localhost:8080/Payments/confirm --json '{{\"id\": \"{}\", \"result\": {{\"success\": true, \"transactionId\": \"txn-123\"}}}}'", payment_id);
    Ok(format!("payRef-{}", Uuid::new_v4()))
}

#[derive(Service)]
struct Payments;

impl Payments {
    #[restate_sdk::handler]
    async fn process(&self, ctx: &mut Context, req: PaymentRequest) -> Result<PaymentResult, RestateError> {
        // Create awakeable to wait for webhook payment confirmation
        let confirmation: Awakeable<PaymentResult> = ctx.awakeable();

        // Initiate payment with external provider (Stripe, PayPal, etc.)
        let payment_id = confirmation.id().clone();
        ctx.run("pay", async move {
            init_payment(&req, &payment_id).await
        }).await?;

        // Wait for external payment provider to call our webhook
        confirmation.await
    }

    #[restate_sdk::handler]
    async fn confirm(&self, ctx: &mut Context, confirmation: ConfirmationRequest) -> Result<(), RestateError> {
        // Resolve the awakeable to continue the payment flow
        ctx.resolve_awakeable(&confirmation.id, confirmation.result)?;
        Ok(())
    }
}

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let service = Payments;
    
    restate_sdk::serve(service)
        .bind("0.0.0.0:9080")
        .await?;
    
    Ok(())
}