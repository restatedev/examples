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

impl TicketObject for TicketObjectImpl {
    async fn reserve(&self, ctx: ObjectContext<'_>) -> Result<bool, HandlerError> {
        let status: TicketStatus = ctx
            .get::<Json<TicketStatus>>("status")
            .await?
            .unwrap_or(Json(TicketStatus::Available))
            .into_inner();

        match status {
            TicketStatus::Available => {
                ctx.set("status", Json(TicketStatus::Reserved));
                Ok(true)
            }
            TicketStatus::Reserved | TicketStatus::Sold => Ok(false),
        }
    }

    async fn unreserve(&self, ctx: ObjectContext<'_>) -> Result<(), HandlerError> {
        let status: TicketStatus = ctx
            .get::<Json<TicketStatus>>("status")
            .await?
            .unwrap_or(Json(TicketStatus::Available))
            .into_inner();

        if let TicketStatus::Reserved = status {
            ctx.clear("status");
        }
        Ok(())
    }

    async fn mark_as_sold(&self, ctx: ObjectContext<'_>) -> Result<(), HandlerError> {
        let status: TicketStatus = ctx
            .get::<Json<TicketStatus>>("status")
            .await?
            .unwrap_or(Json(TicketStatus::Available))
            .into_inner();

        if let TicketStatus::Reserved = status {
            ctx.set("status", Json(TicketStatus::Sold));
        }
        Ok(())
    }
}