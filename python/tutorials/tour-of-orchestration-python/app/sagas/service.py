import restate
from typing import Callable, Awaitable, List

from app.utils import (
    create_recurring_payment,
    remove_recurring_payment,
    create_subscription,
    remove_subscription,
)
from app.types import SubscriptionRequest


subscription_saga = restate.Service("SubscriptionSaga")


@subscription_saga.handler()
async def add(ctx: restate.Context, req: SubscriptionRequest) -> None:
    compensations: List[Callable[[], Awaitable[None]]] = []

    try:
        payment_id = str(ctx.uuid())

        # Add compensation for payment
        compensations.append(
            lambda: ctx.run_typed(
                "undo-pay", remove_recurring_payment, payment_id=payment_id
            )
        )

        # Create payment
        pay_ref = await ctx.run_typed(
            "pay",
            create_recurring_payment,
            credit_card=req.credit_card,
            payment_id=payment_id,
        )

        # Process subscriptions
        for subscription in req.subscriptions:
            # Add compensation for this subscription
            compensations.append(
                lambda s=subscription: ctx.run_typed(
                    f"undo-{s}",
                    remove_subscription,
                    user_id=req.user_id,
                    subscription=s,
                )
            )

            # Create subscription
            await ctx.run_typed(
                f"add-{subscription}",
                create_subscription,
                user_id=req.user_id,
                subscription=subscription,
                payment_ref=pay_ref,
            )

    except restate.TerminalError as e:
        # Run compensations in reverse order
        for compensation in reversed(compensations):
            await compensation()
        raise e
