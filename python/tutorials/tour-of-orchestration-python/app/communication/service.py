import restate
from app.utils import day_before
from app.types import PurchaseTicketRequest
from app.utils import charge, email_ticket, send_reminder


# Concert Ticketing Service
concert_ticketing_service = restate.Service("ConcertTicketingService")


@concert_ticketing_service.handler()
async def buy(ctx: restate.Context, req: PurchaseTicketRequest) -> str:
    # Request-response call - wait for payment to complete
    pay_ref = await ctx.service_call(charge, req)

    # One-way message - fire and forget ticket delivery
    ctx.service_send(email_ticket, req)

    # Delayed message - schedule reminder for day before concert
    ctx.service_send(send_reminder, req, send_delay=day_before(req.concert_date))

    return f"Ticket purchased successfully with payment reference: {pay_ref}"
