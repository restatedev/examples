import restate
from datetime import timedelta

from app.utils import init_payment, cancel_payment
from app.types import PaymentRequest, PaymentResult, ConfirmationRequest


payments_with_timeout = restate.Service("PaymentsWithTimeout")


@payments_with_timeout.handler()
async def process(ctx: restate.Context, req: PaymentRequest) -> PaymentResult:
    confirmation_id, confirmation_promise = ctx.awakeable(type_hint=PaymentResult)

    payment_id = str(ctx.uuid())
    pay_ref = await ctx.run_typed(
        "pay",
        init_payment,
        req=req,
        payment_id=payment_id,
        confirmation_id=confirmation_id,
    )

    # Race between payment confirmation and timeout
    match await restate.select(
        confirmation=confirmation_promise, timeout=ctx.sleep(timedelta(seconds=30))
    ):
        case ["confirmation", result]:
            return result
        case _:
            # Cancel the payment with external provider
            await ctx.run_typed("cancel-payment", cancel_payment, pay_ref=pay_ref)
            return PaymentResult(
                success=False, transaction_id=None, error_message="Payment timeout"
            )


@payments_with_timeout.handler()
async def confirm(ctx: restate.Context, confirmation: ConfirmationRequest) -> None:
    ctx.resolve_awakeable(confirmation.id, confirmation.result)
