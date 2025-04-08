import time

import restate


async def time_now(ctx: restate.ObjectContext | restate.Context | restate.WorkflowContext | restate.WorkflowSharedContext) -> int:
    """
    Get the current time in milliseconds since epoch.

    Args:
        ctx (restate.ObjectContext): The context of the Restate object.

    Returns:
        int: The current time in milliseconds since epoch.
    """
    return await ctx.run("time", lambda: round(time.time() * 1000))