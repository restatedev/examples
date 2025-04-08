import json
import logging
import restate

from restate.exceptions import TerminalError
from utils.types import TaskResult
from utils.utils import time_now

task_executor = restate.Service("TaskExecutor")


@task_executor.handler("execute")
async def execute(ctx: restate.Context, opts: dict) -> None:
    logging.info("Executing task: %s", opts)
    response: TaskResult
    try:
        result = await ctx.generic_call(
            opts["task_service_name"],
            "run",
            arg=opts["task_params"].encode(),
            key=opts["task_id"],
        )
        timestamp = await time_now(ctx)
        response = TaskResult(
            task_name=opts["task_name"], result=json.loads(result), timestamp=timestamp
        )
    except TerminalError as e:
        timestamp = await time_now(ctx)
        response = TaskResult(
            task_name=opts["task_name"],
            result=f"Task failed: {str(e)}",
            timestamp=timestamp,
        )

    logging.info("Task done: %s", opts)
    ctx.generic_send(
        "ChatSession",
        "onTaskDone",
        arg=response.model_dump_json().encode(),
        key=opts["session_id"],
    )
