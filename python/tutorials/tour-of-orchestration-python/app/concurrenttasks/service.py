import restate
import asyncio

from app.utils import create_recurring_payment, create_subscription
from app.types import SubscriptionRequest, SubscriptionResult


parallel_subscription_service = restate.Service("ParallelSubscriptionService")


@parallel_subscription_service.handler()
async def add(ctx: restate.Context, req: SubscriptionRequest) -> SubscriptionResult:
    payment_id = ctx.rand_uuid()
    pay_ref = await ctx.run_typed(
        "pay", lambda: create_recurring_payment(req["creditCard"], payment_id)
    )

    # Start all subscriptions in parallel using asyncio.gather
    subscription_tasks = []
    for subscription in req["subscriptions"]:
        task = ctx.run_typed(
            f"add-{subscription}",
            lambda s=subscription: create_subscription(req["userId"], s, pay_ref),
        )
        subscription_tasks.append(task)

    # Wait for all subscriptions to complete
    await asyncio.gather(*subscription_tasks)

    return SubscriptionResult(success=True, paymentRef=pay_ref)


app = restate.app(services=[parallel_subscription_service])
