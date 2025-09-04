import restate
from typing import Callable, Awaitable, List

from app.utils import create_recurring_payment, remove_recurring_payment, create_subscription, remove_subscription
from app.types import SubscriptionRequest


subscription_saga = restate.Service("SubscriptionSaga")


@subscription_saga.handler()
async def add(ctx: restate.Context, req: SubscriptionRequest) -> None:
    compensations: List[Callable[[], Awaitable[None]]] = []

    try:
        payment_id = ctx.rand_uuid()

        # Add compensation for payment
        compensations.append(
            lambda: ctx.run_typed(
                "undo-pay", lambda: remove_recurring_payment(payment_id)
            )
        )

        # Create payment
        pay_ref = await ctx.run_typed(
            "pay", lambda: create_recurring_payment(req["creditCard"], payment_id)
        )

        # Process subscriptions
        for subscription in req["subscriptions"]:
            # Add compensation for this subscription
            compensations.append(
                lambda s=subscription: ctx.run_typed(
                    f"undo-{s}", lambda: remove_subscription(req["userId"], s)
                )
            )

            # Create subscription
            await ctx.run_typed(
                f"add-{subscription}",
                lambda s=subscription: create_subscription(req["userId"], s, pay_ref),
            )

    except restate.TerminalError as e:
        # Run compensations in reverse order
        for compensation in reversed(compensations):
            await compensation()
        raise e


app = restate.app(services=[subscription_saga])
