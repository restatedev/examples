import restate

from app.utils import create_recurring_payment, create_subscription
from app.types import SubscriptionRequest


subscription_service = restate.Service("SubscriptionService")


@subscription_service.handler()
async def add(ctx: restate.Context, req: SubscriptionRequest) -> None:
    payment_id = ctx.uuid()

    pay_ref = await ctx.run_typed(
        "pay", lambda: create_recurring_payment(req.credit_card, payment_id)
    )

    for subscription in req.subscriptions:
        await ctx.run_typed(
            f"add-{subscription}",
            lambda s=subscription: create_subscription(req.user_id, s, pay_ref),
        )
