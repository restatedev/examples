use restate_sdk::prelude::*;

#[restate_sdk::object]
pub trait SubscriptionService {
    async fn create(user_id: String) -> Result<String, HandlerError>;
    async fn cancel() -> Result<(), HandlerError>;
}

pub struct SubscriptionServiceImpl;

impl SubscriptionService for SubscriptionServiceImpl {
    async fn create(&self, _ctx: ObjectContext<'_>, _user_id: String) -> Result<String, HandlerError> {
        Ok("SUCCESS".to_string())
    }

    async fn cancel(&self, ctx: ObjectContext<'_>) -> Result<(), HandlerError> {
        println!("Cancelling all subscriptions for user {}", ctx.key());
        Ok(())
    }
}