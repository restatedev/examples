use crate::auxiliary::email_client::EmailClient;
use crate::auxiliary::payment_client::PaymentClient;
use restate_sdk::prelude::*;
use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub(crate) struct CheckoutRequest {
    pub(crate) user_id: String,
    pub(crate) tickets: Vec<String>,
}

#[restate_sdk::service]
pub(crate) trait CheckoutService {
    async fn handle(request: Json<CheckoutRequest>) -> Result<bool, HandlerError>;
}

pub struct CheckoutServiceImpl;

impl CheckoutService for CheckoutServiceImpl {
    async fn handle(
        &self,
        mut ctx: Context<'_>,
        Json(CheckoutRequest { user_id, tickets }): Json<CheckoutRequest>,
    ) -> Result<bool, HandlerError> {
        let total_price = tickets.len() as f64 * 40.0;

        let idempotency_key = ctx.rand_uuid().to_string();

        let pay_client = PaymentClient::new();
        let success = ctx
            .run(|| pay_client.call(&idempotency_key, total_price))
            .await?;

        let email_client = EmailClient::new();
        if success {
            ctx.run(|| email_client.notify_user_of_payment_success(&user_id))
                .await?;
        } else {
            ctx.run(|| email_client.notify_user_of_payment_failure(&user_id))
                .await?;
        }
        Ok(success)
    }
}
