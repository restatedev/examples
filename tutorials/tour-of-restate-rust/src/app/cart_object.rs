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
    async fn add_ticket(
        &self,
        _ctx: ObjectContext<'_>,
        _ticket_id: String,
    ) -> Result<bool, HandlerError> {
        Ok(true)
    }

    async fn checkout(&self, _ctx: ObjectContext<'_>) -> Result<bool, HandlerError> {
        Ok(true)
    }

    async fn expire_ticket(
        &self,
        _ctx: ObjectContext<'_>,
        _ticket_id: String,
    ) -> Result<(), HandlerError> {

        Ok(())
    }
}
