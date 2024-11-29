use crate::auxiliary::ticket_status::TicketStatus;
use restate_sdk::prelude::*;

#[restate_sdk::object]
pub(crate) trait TicketObject {
    async fn reserve() -> Result<bool, HandlerError>;
    async fn unreserve() -> Result<(), HandlerError>;
    #[name = "markAsSold"]
    async fn mark_as_sold() -> Result<(), HandlerError>;
}

pub struct TicketObjectImpl;

const STATUS: &str = "status";

impl TicketObject for TicketObjectImpl {
    async fn reserve(&self, ctx: ObjectContext<'_>) -> Result<bool, HandlerError> {
        Ok(true)
    }

    async fn unreserve(&self, ctx: ObjectContext<'_>) -> Result<(), HandlerError> {
        Ok(())
    }

    async fn mark_as_sold(&self, ctx: ObjectContext<'_>) -> Result<(), HandlerError> {
        Ok(())
    }
}
