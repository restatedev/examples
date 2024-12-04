use std::collections::HashSet;
use restate_sdk::prelude::*;
use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub(crate) struct CheckoutRequest {
    pub(crate) user_id: String,
    pub(crate) tickets: HashSet<String>,
}

// <start_checkout>
#[restate_sdk::service]
pub(crate) trait CheckoutService {
    async fn handle(request: Json<CheckoutRequest>) -> Result<bool, HandlerError>;
}

pub struct CheckoutServiceImpl;

impl CheckoutService for CheckoutServiceImpl {
    async fn handle(
        &self,
        _ctx: Context<'_>,
        Json(CheckoutRequest { user_id: _, tickets: _ }): Json<CheckoutRequest>,
    ) -> Result<bool, HandlerError> {
        Ok(true)
    }
}
// <end_checkout>
