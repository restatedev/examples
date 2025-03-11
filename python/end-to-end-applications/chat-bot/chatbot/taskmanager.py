"""
  The Task Manager has the map of available task workflows.
  It maintains the mapping from task_type (name of the task type) to the
  implementing workflow service, and has the utilities to start, cancel,
  and query them.
"""
import logging
import uuid
from typing import Dict, Any

from restate import Context, Service
from restate.exceptions import TerminalError

from chatbot import chat_session
from chatbot.tasks.task_workflow import TaskSpec
from chatbot.utils.types import TaskResult, TaskOpts

from chatbot.tasks.flight_price_watcher import flightTask
from chatbot.tasks.reminder_service import reminderTask


TASK_TYPES: Dict[str, TaskSpec] = {
    reminderTask.task_type_name: reminderTask,
    flightTask.task_type_name: flightTask
    }

# ----------------- start / cancel / query task workflows --------------------

async def start_task(ctx: Context, channel_for_result: str, task_opts: TaskOpts) -> str:
    task = TASK_TYPES.get(task_opts.workflow_name)
    if not task:
        raise ValueError(f"Unknown task type: {task_opts.workflow_name}")

    workflow_params = task.params_parser(task_opts.name, task_opts.params)
    workflow_id = await ctx.run("workflow_id", lambda: str(uuid.uuid4()))

    ctx.service_send(invoke_workflow, {
        'task_name': task_opts.name,
        'workflow_service_name': task_opts.workflow_name,
        'workflow_params': workflow_params,
        'workflow_id': workflow_id,
        'channel_for_result': channel_for_result
    })

    return workflow_id


async def cancel_task(ctx: Context, workflow_name: str, workflow_id: str) -> None:
    task = TASK_TYPES.get(workflow_name)
    if not task:
        raise ValueError(f"Can't cancel task type for workflow ID {workflow_id} - Unknown task type: {workflow_name}")

    await ctx.workflow_call(task.task_workflow.cancel, workflow_id, None)


async def get_task_status(ctx: Context, workflow_name: str, workflow_id: str) -> Any:
    task = TASK_TYPES.get(workflow_name)
    if not task:
        raise ValueError(f"Can't get task status for workflow ID {workflow_id} - Unknown task type: {workflow_name}")

    return await ctx.workflow_call(task.task_workflow.current_status, workflow_id, None)


workflow_invoker = Service("WorkflowInvoker")

@workflow_invoker.handler("invokeWorkflow")
async def invoke_workflow(ctx: Context, opts: dict) -> None:
    logging.info("Invoking workflow: %s", opts)
    task = TASK_TYPES.get(opts["workflow_service_name"])
    if not task:
        logging.error("Unknown task type: %s", opts["workflow_service_name"])
        raise TerminalError(f"Unknown task type: {opts['workflow_service_name']}")
    response: TaskResult
    try:
        result = await ctx.workflow_call(task.task_workflow.run, opts['workflow_id'], opts['workflow_params'])
        response = TaskResult(task_name=opts['task_name'], result=result)
    except Exception as e:
        response = TaskResult(task_name=opts['task_name'], result=f"Task failed: {str(e)}")

    ctx.object_send(chat_session.on_task_done, opts['channel_for_result'], response)
