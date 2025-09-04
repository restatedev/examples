import restate

from app.utils import create_recurring_payment, create_subscription
from app.types import SubscriptionRequest


subscription_service = restate.Service("SubscriptionService")


@subscription_service.handler()
async def add(ctx: restate.Context, req: SubscriptionRequest) -> None:
    payment_id = ctx.rand_uuid()

    pay_ref = await ctx.run_typed(
        "pay", lambda: create_recurring_payment(req["creditCard"], payment_id)
    )

    for subscription in req["subscriptions"]:
        await ctx.run_typed(
            f"add-{subscription}",
            lambda s=subscription: create_subscription(req["userId"], s, pay_ref),
        )


app = restate.app(services=[subscription_service])
