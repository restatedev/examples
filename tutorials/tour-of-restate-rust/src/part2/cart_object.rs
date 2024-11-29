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

const TICKETS: &str = "ticket";

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
            let mut tickets = ctx
                .get::<Json<Vec<String>>>(TICKETS)
                .await?
                .unwrap_or_default()
                .into_inner();
            tickets.push(ticket_id.clone());
            ctx.set(TICKETS, Json(tickets));

            ctx.object_client::<CartObjectClient>(ctx.key())
                .expire_ticket(ticket_id.clone())
                .send_with_delay(Duration::from_millis(15 * 60 * 1000));
        }

        Ok(reservation_success)
    }
    // <end_add_ticket>

    // <start_checkout>
    async fn checkout(&self, ctx: ObjectContext<'_>) -> Result<bool, HandlerError> {
        let tickets = ctx
            .get::<Json<Vec<String>>>(TICKETS)
            .await?
            .unwrap_or_default()
            .into_inner();

        let success = ctx
            .service_client::<CheckoutServiceClient>()
            .handle(Json(CheckoutRequest {
                user_id: ctx.key().parse()?,
                tickets: tickets.clone(),
            }))
            .call()
            .await?;

        if success {
            for ticket_id in tickets {
                ctx.object_client::<TicketObjectClient>(ticket_id)
                    .mark_as_sold()
                    .send();
            }
            ctx.clear(TICKETS);
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
            .get::<Json<Vec<String>>>(TICKETS)
            .await?
            .unwrap_or_default()
            .into_inner();

        if let Some(ticket_index) = tickets.iter().position(|ticket| ticket == &ticket_id) {
            tickets.remove(ticket_index);
            ctx.set(TICKETS, Json(tickets));

            ctx.object_client::<TicketObjectClient>(ticket_id)
                .unreserve()
                .send();
        }

        Ok(())
    }
    // <end_expire_ticket>
}
