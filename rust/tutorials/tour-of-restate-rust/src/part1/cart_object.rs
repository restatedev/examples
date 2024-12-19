use std::collections::HashSet;
use crate::checkout_service::{CheckoutRequest, CheckoutServiceClient};
use crate::ticket_object::TicketObjectClient;
use restate_sdk::prelude::*;

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
        // !mark(1:5)
        let _reservation_success = ctx
            .object_client::<TicketObjectClient>(ticket_id.clone())
            .reserve()
            .call()
            .await?;

        Ok(true)
    }
    // <end_add_ticket>

    // <start_checkout>
    async fn checkout(&self, ctx: ObjectContext<'_>) -> Result<bool, HandlerError> {
        // !mark(1:8)
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
    // <end_checkout>

    // <start_expire_ticket>
    async fn expire_ticket(
        &self,
        ctx: ObjectContext<'_>,
        ticket_id: String,
    ) -> Result<(), HandlerError> {
        // !mark(1:3)
        ctx.object_client::<TicketObjectClient>(ticket_id)
            .unreserve()
            .send();

        Ok(())
    }
    // <end_expire_ticket>
}
