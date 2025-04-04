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
            // !mark(1:7)
            let mut tickets = ctx
                .get::<Json<HashSet<String>>>("tickets")
                .await?
                .unwrap_or_default()
                .into_inner();
            tickets.insert(ticket_id.clone());
            ctx.set("tickets", Json(tickets));

            ctx.object_client::<CartObjectClient>(ctx.key())
                .expire_ticket(ticket_id.clone())
                .send_after(Duration::from_secs(15 * 60));
        }

        Ok(reservation_success)
    }
    // <end_add_ticket>

    // <start_checkout>
    async fn checkout(&self, ctx: ObjectContext<'_>) -> Result<bool, HandlerError> {
        // !mark(1:9)
        let tickets = ctx
            .get::<Json<HashSet<String>>>("tickets")
            .await?
            .unwrap_or_default()
            .into_inner();

        if tickets.is_empty() {
            return Ok(false);
        }

        let success = ctx
            .service_client::<CheckoutServiceClient>()
            .handle(Json(CheckoutRequest {
                user_id: ctx.key().parse()?,
                tickets: tickets.clone(),
            }))
            .call()
            .await?;

        if success {
            // !mark
            ctx.clear("tickets");
        }

        Ok(success)
    }
    // <end_checkout>

    // <start_expire_ticket>
    async fn expire_ticket(
        &self,
        ctx: ObjectContext<'_>,
        ticket_id: String,
    ) -> Result<(), HandlerError> {
        let mut tickets = ctx
            .get::<Json<HashSet<String>>>("tickets")
            .await?
            .unwrap_or_default()
            .into_inner();

        if tickets.remove(&ticket_id) {
            ctx.set("tickets", Json(tickets));

            ctx.object_client::<TicketObjectClient>(ticket_id)
                .unreserve()
                .send();
        }

        Ok(())
    }
    // <end_expire_ticket>
}
