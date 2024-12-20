use std::collections::HashSet;
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
    // <start_add_ticket>
    async fn add_ticket(
        &self,
        ctx: ObjectContext<'_>,
        ticket_id: String,
    ) -> Result<bool, HandlerError> {
        let reservation_success = ctx
            .object_client::<TicketObjectClient>(ticket_id.clone())
            .reserve()
            .call()
            .await?;

        if reservation_success {
            // !mark(1:3)
            ctx.object_client::<CartObjectClient>(ctx.key())
                .expire_ticket(ticket_id.clone())
                .send_with_delay(Duration::from_millis(15 * 60 * 1000));
        }

        Ok(reservation_success)
    }
    // <end_add_ticket>

    async fn checkout(&self, ctx: ObjectContext<'_>) -> Result<bool, HandlerError> {
        let success = ctx
            .service_client::<CheckoutServiceClient>()
            .handle(Json(CheckoutRequest {
                user_id: ctx.key().parse()?,
                tickets: HashSet::from([String::from("seat2B")]),
            }))
            .call()
            .await?;

        Ok(success)
    }

    async fn expire_ticket(
        &self,
        ctx: ObjectContext<'_>,
        ticket_id: String,
    ) -> Result<(), HandlerError> {
        ctx.object_client::<TicketObjectClient>(ticket_id)
            .unreserve()
            .send();

        Ok(())
    }
}
