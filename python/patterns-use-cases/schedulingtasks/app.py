import restate
from datetime import timedelta
from utils import send_reminder_email, escalate_to_human, StripeEvent

payment_tracker = restate.VirtualObject("PaymentTracker")  # one instance per invoice ID


# Stripe sends us webhook events for invoice payment attempts
@payment_tracker.handler("onPaymentSuccess")
async def on_payment_success(ctx: restate.ObjectContext, _event: StripeEvent):
    ctx.set("paid", True)


@payment_tracker.handler("onPaymentFailure")
async def on_payment_failure(ctx: restate.ObjectContext, event: StripeEvent):
    if await ctx.get("paid", type_hint=bool):
        return

    reminder_count = await ctx.get("reminder_count") or 0
    if reminder_count < 3:
        ctx.set("reminder_count", reminder_count + 1)
        await ctx.run_typed("send_reminder", send_reminder_email, event=event)

        # Schedule next reminder via a delayed self call
        ctx.object_send(
            on_payment_failure,  # this handler
            ctx.key(),  # this object invoice id
            event,
            send_delay=timedelta(days=1),
        )
    else:
        await ctx.run_typed("escalate", escalate_to_human, event=event)


app = restate.app([payment_tracker])


if __name__ == "__main__":
    import hypercorn
    import asyncio

    conf = hypercorn.Config()
    conf.bind = ["0.0.0.0:9080"]
    asyncio.run(hypercorn.asyncio.serve(app, conf))
