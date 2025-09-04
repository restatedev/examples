import restate
from app.utils import day_before
from app.types import PurchaseTicketRequest


# Concert Ticketing Service
concert_ticketing_service = restate.Service("ConcertTicketingService")


@concert_ticketing_service.handler()
async def buy(ctx: restate.Context, req: PurchaseTicketRequest) -> str:
    # Request-response call - wait for payment to complete
    pay_ref = await ctx.service_call(charge, req)

    # One-way message - fire and forget ticket delivery
    ctx.service_send(email_ticket, req)

    # Delayed message - schedule reminder for day before concert
    delay = day_before(req.concert_date_time)
    ctx.service_send(send_reminder, req, send_delay=delay)

    return f"Ticket purchased successfully with payment reference: {pay_ref}"


# Payment Service
payment_service = restate.Service("PaymentService")


@payment_service.handler()
async def charge(ctx: restate.Context, req: PurchaseTicketRequest) -> str:
    # Simulate payment processing
    payment_id = str(ctx.uuid())
    print(f"Processing payment for ticket {req.ticket_id} with payment ID {payment_id}")
    return payment_id


# Email Service
email_service = restate.Service("EmailService")


@email_service.handler()
async def email_ticket(ctx: restate.Context, req: PurchaseTicketRequest) -> None:
    print(
        f"Sending ticket to {req.customer_email} for concert on {req.concert_date_time}"
    )


@email_service.handler()
async def send_reminder(ctx: restate.Context, req: PurchaseTicketRequest) -> None:
    print(
        f"Sending reminder for concert on {req.concert_date_time} to {req.customer_email}"
    )
