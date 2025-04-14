import typing
import restate

from datetime import timedelta
from pydantic import BaseModel
from accounts import account

# A service that processes the payment requests.
# This is implemented as a virtual object to ensure that only one concurrent request can happen
# per payment-id. Requests are queued and processed sequentially per id.
# Methods can be called multiple times with the same payment-id, but payment will be executed
# only once. If a 'cancelPayment' is called for an id, the payment will either be undone, or
# blocked from being made in the future, depending on whether the cancel call comes before or after
# the 'makePayment' call.
payment_processor = restate.VirtualObject("PaymentProcessor")

# The key under which we store the status.
STATUS = "status"

# The key under which we store the original payment request.
PAYMENT = "payment"

EXPIRY_TIMEOUT = timedelta(days=1)

class Payment(BaseModel):
    account_id: str
    amount_cents: int

class Result(BaseModel):
    success: bool
    message: str

PaymentStatus = typing.Literal["NEW", "COMPLETED_SUCCESSFULLY", "CANCELED"]


@payment_processor.handler("makePayment")
async def make_payment(ctx: restate.ObjectContext, payment: Payment) -> Result:
    payment_id = ctx.key()
    status = await ctx.get(STATUS, type_hint=PaymentStatus) or PaymentStatus.NEW

    if status == PaymentStatus.CANCELED:
        return Result(success=False, message="Payment already cancelled")
    if status == PaymentStatus.COMPLETED_SUCCESSFULLY:
        return Result(success=False, message="Payment already completed in prior call")

    # Charge the target account
    payment_result = await ctx.object_call(
        account.withdraw,
        key=payment.account_id,
        arg=payment.amount_cents
    )

    # Remember only on success, so that on failure (when we didn't charge) the external
    # caller may retry this (with the same payment-id), for the sake of this example
    if payment_result.success:
        ctx.set(STATUS, PaymentStatus.COMPLETED_SUCCESSFULLY)
        ctx.set(PAYMENT, payment)
        ctx.object_send(expire, payment_id, send_delay=EXPIRY_TIMEOUT, arg=None)

    return payment_result


@payment_processor.handler("cancelPayment")
async def cancel_payment(ctx: restate.ObjectContext):
    status = await ctx.get(STATUS, type_hint=PaymentStatus) or PaymentStatus.NEW

    if status == PaymentStatus.NEW:
        # not seen this payment-id before, mark as canceled, in case the cancellation
        # overtook the actual payment request (on the external caller's side)
        ctx.set(STATUS, PaymentStatus.CANCELED)
        ctx.object_send(expire, ctx.key(), send_delay=EXPIRY_TIMEOUT, arg=None)

    elif status == PaymentStatus.CANCELED:
        pass

    elif status == PaymentStatus.COMPLETED_SUCCESSFULLY:
        # remember this as cancelled
        ctx.set(STATUS, PaymentStatus.CANCELED)

        # undo the payment
        payment = await ctx.get(PAYMENT, type_hint=Payment)
        ctx.object_send(account.deposit, key=payment.account_id, arg=payment.amount_cents)


@payment_processor.handler()
async def expire(ctx: restate.ObjectContext):
    ctx.clear_all()


