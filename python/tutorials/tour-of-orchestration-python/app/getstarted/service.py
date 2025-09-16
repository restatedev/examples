import restate

from app.utils import create_recurring_payment, create_subscription
from app.types import SubscriptionRequest


subscription_service = restate.Service("SubscriptionService")


@subscription_service.handler()
async def add(ctx: restate.Context, req: SubscriptionRequest) -> None:
    payment_id = str(ctx.uuid())

    pay_ref = await ctx.run_typed(
        "pay",
        create_recurring_payment,
        credit_card=req.credit_card,
        payment_id=payment_id,
    )

    for subscription in req.subscriptions:
        await ctx.run_typed(
            f"add-{subscription}",
            create_subscription,
            user_id=req.user_id,
            subscription=subscription,
            payment_ref=pay_ref,
        )
