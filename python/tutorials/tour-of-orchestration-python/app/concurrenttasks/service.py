import restate
import asyncio

from app.utils import create_recurring_payment, create_subscription
from app.types import SubscriptionRequest, SubscriptionResult


parallel_subscription_service = restate.Service("ParallelSubscriptionService")


@parallel_subscription_service.handler()
async def add(ctx: restate.Context, req: SubscriptionRequest) -> SubscriptionResult:
    payment_id = str(ctx.uuid())
    pay_ref = await ctx.run_typed(
        "pay",
        create_recurring_payment,
        credit_card=req.credit_card,
        payment_id=payment_id,
    )

    # Start all subscriptions in parallel using asyncio.gather
    subscription_tasks = []
    for subscription in req.subscriptions:
        task = ctx.run_typed(
            f"add-{subscription}",
            create_subscription,
            user_id=req.user_id,
            subscription=subscription,
            payment_ref=pay_ref,
        )
        subscription_tasks.append(task)

    # Wait for all subscriptions to complete
    await asyncio.gather(*subscription_tasks)

    return SubscriptionResult(success=True, payment_ref=pay_ref)
