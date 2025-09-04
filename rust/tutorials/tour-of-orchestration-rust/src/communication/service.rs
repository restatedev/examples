use restate_sdk::{Context, Service, Result, RestateError};
use serde::{Deserialize, Serialize};
use std::time::{Duration, SystemTime, UNIX_EPOCH};
use uuid::Uuid;

#[derive(Deserialize)]
struct PurchaseTicketRequest {
    ticket_id: String,
    concert_date_time: String,
    price: f64,
    customer_email: String,
}

// dayBefore calculates delay until day before concert
fn day_before(concert_date: &str) -> Duration {
    // For this example, return 1 minute delay
    // In real implementation, parse ISO format and calculate actual delay
    Duration::from_secs(60)
}

#[derive(Service)]
struct PaymentService;

impl PaymentService {
    #[restate_sdk::handler]
    async fn charge(&self, ctx: &mut Context, req: PurchaseTicketRequest) -> Result<String, RestateError> {
        // Simulate payment processing
        let payment_id = ctx.random_uuid().to_string();
        println!("Processing payment for ticket {} with payment ID {}", 
                req.ticket_id, payment_id);
        Ok(payment_id)
    }
}

#[derive(Service)]
struct EmailService;

impl EmailService {
    #[restate_sdk::handler]
    async fn email_ticket(&self, ctx: &mut Context, req: PurchaseTicketRequest) -> Result<(), RestateError> {
        println!("Sending ticket to {} for concert on {}", 
                req.customer_email, req.concert_date_time);
        Ok(())
    }

    #[restate_sdk::handler]
    async fn send_reminder(&self, ctx: &mut Context, req: PurchaseTicketRequest) -> Result<(), RestateError> {
        println!("Sending reminder for concert on {} to {}", 
                req.concert_date_time, req.customer_email);
        Ok(())
    }
}

#[derive(Service)]
struct ConcertTicketingService;

impl ConcertTicketingService {
    #[restate_sdk::handler]
    async fn buy(&self, ctx: &mut Context, req: PurchaseTicketRequest) -> Result<String, RestateError> {
        // Request-response call - wait for payment to complete
        let pay_ref = ctx.service_call("PaymentService", "charge", &req).await?;

        // One-way message - fire and forget ticket delivery
        ctx.service_send("EmailService", "email_ticket", &req).await?;

        // Delayed message - schedule reminder for day before concert
        let delay = day_before(&req.concert_date_time);
        ctx.service_send_delayed("EmailService", "send_reminder", &req, delay).await?;

        Ok(format!("Ticket purchased successfully with payment reference: {}", pay_ref))
    }
}

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let payment_service = PaymentService;
    let email_service = EmailService;
    let ticketing_service = ConcertTicketingService;
    
    restate_sdk::serve_multiple(vec![
        Box::new(payment_service),
        Box::new(email_service),
        Box::new(ticketing_service),
    ])
    .bind("0.0.0.0:9080")
    .await?;
    
    Ok(())
}