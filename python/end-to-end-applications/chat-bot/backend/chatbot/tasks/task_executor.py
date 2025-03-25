import json
import logging
import time
import restate

from restate.exceptions import TerminalError
from chatbot.utils.types import TaskResult

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
        timestamp = await ctx.run("time", lambda: round(time.time() * 1000))
        response = TaskResult(
            task_name=opts["task_name"], result=json.loads(result), timestamp=timestamp
        )
    except TerminalError as e:
        timestamp = await ctx.run("time", lambda: round(time.time() * 1000))
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
