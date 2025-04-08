import logging
import restate
from datetime import datetime, timedelta
from typing import Any

from utils.types import ReminderOpts, TaskSpec, TaskHandlers
from utils.utils import time_now

reminder_service = restate.Workflow("ReminderService")


@reminder_service.main()
async def run(ctx: restate.WorkflowContext, opts: ReminderOpts):
    logging.info(f"Running reminder workflow for: {opts}")
    ctx.set("timestamp", opts.timestamp)
    timestamp = await time_now(ctx)

    await ctx.sleep(timedelta(milliseconds=opts.timestamp - timestamp))

    return f"It is time. {opts.description}"


@reminder_service.handler("getCurrentStatus")
async def get_current_status(ctx: restate.WorkflowSharedContext) -> dict:
    timestamp = await ctx.get("timestamp")
    if not timestamp:
        return {"remaining_time": -1}

    current_time = await time_now(ctx)
    time_remaining = timestamp - current_time
    return {"remaining_time": time_remaining if time_remaining > 0 else 0}


def params_parser(params: Any) -> ReminderOpts:
    return ReminderOpts(**params)


reminder_task = TaskSpec(
    task_service_name="ReminderService",
    task_type_name="reminder",
    task_handlers=TaskHandlers(run=run, get_current_status=get_current_status),
    params_parser=params_parser,
)
