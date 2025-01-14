use rand::random;
use anyhow::{anyhow, Result};
use restate_sdk::errors::HandlerError;
use log::{error, info};
use serde::{Deserialize, Serialize};

#[derive(Deserialize)]
pub struct SubscriptionRequest {
    pub user_id: String,
    pub credit_card: String,
    pub subscriptions: Vec<String>,
}

#[derive(Deserialize, Serialize)]
pub struct User {
    pub name: String,
    pub email: String,
}

#[derive(Deserialize, Serialize)]
pub struct BankAccountCharge {
    pub amount: f64,
    pub account: String,
}

pub async fn create_subscription(user_id: &str, subscription: &str, _payment_ref: &str) -> Result<String, HandlerError> {
    if random::<f32>() < 0.3 {
        error!("👻 Failed to create subscription: {} - {}", user_id, subscription);
        return Err(HandlerError::from(anyhow!("👻 Failed to create subscription: {} - {}", user_id, subscription)));
    }
    info!("Creating subscription {} for user {}", subscription, user_id);
    Ok("SUCCESS".to_string())
}

pub async fn create_recurring_payment(_credit_card: &str, payment_id: &str) -> Result<String, HandlerError> {
    if random::<f32>() < 0.5 {
        error!("👻 Failed to create recurring payment: {} ", payment_id);
        return Err(HandlerError::from(anyhow!("👻 Failed to create recurring payment: {}", payment_id)));
    }
    info!("Creating recurring payment {}", payment_id);
    Ok("payment-reference".to_string())
}

pub async fn create_user_entry(entry: &User) -> Result<(), HandlerError> {
    info!("Creating user entry for {}", entry.name);
    Ok(())
}

pub async fn send_email_with_link(user_id: &str, user: &User, secret: &str) -> Result<(), HandlerError> {
    info!("Sending email to {} with secret {}. \n
    To simulate a user clicking the link, run the following command: \n
    curl localhost:8080/SignupWorkflow/{}/click -H 'content-type: application/json' -d '\"{}\"'",
             user.email, secret, user_id, secret);
    Ok(())
}

pub async fn charge_bank_account(_payment_deduplication_id: &str, _payment: &f32) -> Result<(), HandlerError> {
    Ok(())
}