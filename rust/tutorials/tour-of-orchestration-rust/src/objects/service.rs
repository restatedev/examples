use restate_sdk::{ObjectContext, VirtualObject, Result, RestateError};
use serde::{Deserialize, Serialize};
use std::time::SystemTime;

#[derive(VirtualObject)]
struct UserSubscriptions;

impl UserSubscriptions {
    #[restate_sdk::handler]
    async fn add(&self, ctx: &mut ObjectContext, subscription: String) -> Result<(), RestateError> {
        // Get current subscriptions
        let mut subscriptions: Vec<String> = ctx.get("subscriptions").await?
            .unwrap_or_default();

        // Add new subscription
        if !subscriptions.contains(&subscription) {
            subscriptions.push(subscription);
        }
        ctx.set("subscriptions", &subscriptions).await?;

        // Update metrics
        let now = SystemTime::now()
            .duration_since(SystemTime::UNIX_EPOCH)
            .map_err(|_| RestateError::internal("Time error"))?;
        ctx.set("lastUpdated", &now.as_secs().to_string()).await?;

        Ok(())
    }

    #[restate_sdk::handler(shared)]
    async fn get_subscriptions(&self, ctx: &ObjectContext) -> Result<Vec<String>, RestateError> {
        Ok(ctx.get("subscriptions").await?
            .unwrap_or_default())
    }
}

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let object = UserSubscriptions;
    
    restate_sdk::serve_object(object)
        .bind("0.0.0.0:9080")
        .await?;
    
    Ok(())
}