import restate

from app.utils import init_payment
from app.types import PaymentRequest, PaymentResult, ConfirmationRequest


payments = restate.Service("Payments")


@payments.handler()
async def process(ctx: restate.Context, req: PaymentRequest) -> PaymentResult:
    # Create awakeable to wait for webhook payment confirmation
    confirmation = ctx.awakeable()

    # Initiate payment with external provider (Stripe, PayPal, etc.)
    await ctx.run_typed("pay", init_payment, req=req, confirmation_id=confirmation.id)

    # Wait for external payment provider to call our webhook
    return await confirmation.promise


@payments.handler()
async def confirm(ctx: restate.Context, confirmation: ConfirmationRequest) -> None:
    # Resolve the awakeable to continue the payment flow
    ctx.resolve_awakeable(confirmation.id, confirmation.result)
