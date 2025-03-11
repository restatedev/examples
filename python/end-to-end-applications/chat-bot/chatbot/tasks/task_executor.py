import json
import logging

import time

import restate

from chatbot.utils.types import TaskResult

task_executor = restate.Service("TaskExecutor")

@task_executor.handler("execute")
async def execute(ctx: restate.Context, opts: dict) -> None:
    logging.info("Executing task: %s", opts)
    response: TaskResult
    try:
        result = json.loads(await ctx.generic_call(opts["task_service_name"], "run", arg=json.dumps(opts['task_params']).encode(), key=opts['task_id']))
        timestamp = await ctx.run("time", lambda: round(time.time() * 1000))
        response = TaskResult(task_name=opts['task_name'], result=result, timestamp=timestamp)
    except Exception as e:
        timestamp = await ctx.run("time", lambda: round(time.time() * 1000))
        response = TaskResult(task_name=opts['task_name'], result=f"Task failed: {str(e)}", timestamp=timestamp)


    logging.info("Task done: %s", opts)
    ctx.generic_send("ChatSession", "onTaskDone", arg=json.dumps(response).encode(), key=opts['session_id'])