import restate
from datetime import datetime
from typing import List


user_subscriptions = restate.VirtualObject("UserSubscriptions")


@user_subscriptions.handler()
async def add(ctx: restate.ObjectContext, subscription: str) -> None:
    # Get current subscriptions
    subscriptions = await ctx.get("subscriptions", type_hint=List[str]) or []

    # Add new subscription
    if subscription not in subscriptions:
        subscriptions.append(subscription)

    ctx.set("subscriptions", subscriptions)

    # Update metrics
    ctx.set("lastUpdated", datetime.now().isoformat())


@user_subscriptions.handler("getSubscriptions")
async def get_subscriptions(ctx: restate.ObjectSharedContext) -> List[str]:
    return await ctx.get("subscriptions", type_hint=List[str]) or []
