import restate
from datetime import timedelta
from restate import VirtualObject, ObjectContext
from utils import send_reminder_email, escalate_to_human, StripeEvent

payment_tracker = VirtualObject("PaymentTracker") # one instance per invoice ID


# Stripe sends us webhook events for invoice payment attempts
@payment_tracker.handler("onPaymentSuccess")
async def on_payment_success(ctx: ObjectContext, _event: StripeEvent):
    ctx.set("paid", True)


@payment_tracker.handler("onPaymentFailure")
async def on_payment_failure(ctx: ObjectContext, event: StripeEvent):
    if await ctx.get("paid"):
        return

    reminder_count = await ctx.get("reminder_count") or 0
    if reminder_count < 3:
        ctx.set("reminder_count", reminder_count + 1)
        await ctx.run("send_reminder", lambda: send_reminder_email(event))

        # Schedule next reminder via a delayed self call
        ctx.object_send(
            on_payment_failure, # this handler
            ctx.key(), # this object invoice id
            event,
            send_delay=timedelta(days=1))
    else:
        await ctx.run("escalate", lambda: escalate_to_human(event))

app = restate.app([payment_tracker])

