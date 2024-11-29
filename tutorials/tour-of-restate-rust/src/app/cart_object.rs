use crate::checkout_service::{CheckoutRequest, CheckoutServiceClient};
use crate::ticket_object::TicketObjectClient;
use restate_sdk::prelude::*;
use std::time::Duration;

#[restate_sdk::object]
pub(crate) trait CartObject {
    #[name = "addTicket"]
    async fn add_ticket(ticket_id: String) -> Result<bool, HandlerError>;
    async fn checkout() -> Result<bool, HandlerError>;
    #[name = "expireTicket"]
    async fn expire_ticket(ticket_id: String) -> Result<(), HandlerError>;
}

pub struct CartObjectImpl;

impl CartObject for CartObjectImpl {
    async fn add_ticket(
        &self,
        ctx: ObjectContext<'_>,
        ticket_id: String,
    ) -> Result<bool, HandlerError> {
        Ok((true))
    }

    async fn checkout(&self, ctx: ObjectContext<'_>) -> Result<bool, HandlerError> {
        Ok((true))
    }

    async fn expire_ticket(
        &self,
        ctx: ObjectContext<'_>,
        ticket_id: String,
    ) -> Result<(), HandlerError> {

        Ok(())
    }
}
