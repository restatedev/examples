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
    // <start_reserve>
    async fn reserve(&self, ctx: ObjectContext<'_>) -> Result<bool, HandlerError> {
        let status: TicketStatus = ctx
            .get::<Json<TicketStatus>>("status")
            .await?
            .unwrap_or(Json(TicketStatus::Available))
            .into_inner();

        if let TicketStatus::Available = status {
            ctx.set("status", Json(TicketStatus::Reserved));
            Ok(true)
        } else {
            Ok(false)
        }
    }
    // <end_reserve>

    // <start_unreserve>
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
    // <end_unreserve>

    // <start_mark_as_sold>
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
    // <end_mark_as_sold>
}
