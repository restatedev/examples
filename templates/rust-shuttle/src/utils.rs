use rand::random;
use anyhow::{anyhow, Result};
use restate_sdk::errors::HandlerError;

pub async fn send_notification(greeting_id: &str, name: &str) -> Result<(), HandlerError> {
    if random::<f32>() < 0.5 {
        println!("👻 Failed to send notification: {} - {}", greeting_id, name);
        return Err(HandlerError::from(anyhow!("Failed to send notification: {} - {}", greeting_id, name)));
    }
    println!("Notification sent: {} - {}", greeting_id, name);
    Ok(())
}

pub async fn send_reminder(greeting_id: &str)-> Result<(), HandlerError> {
    if random::<f32>() < 0.5 {
        println!("👻 Failed to send reminder:  - {}", greeting_id);
        return Err(HandlerError::from(anyhow!("Failed to send reminder: {}", greeting_id)));
    }
    println!("Reminder sent: {}", greeting_id);
    Ok(())
}