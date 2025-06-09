"""
The command router routes the commands of the user to the correct task.
This can be to start, cancel, list, or get the status of a task.
It has the map of available task workflows.
It maintains the mapping from task_type (name of the task type) to the
implementing task service, and has the utilities to start, cancel,
and query them.
"""

import json
import uuid
import restate
from typing import Any

from restate.exceptions import TerminalError

from tasks import task_executor
from utils.types import (
    TaskOpts,
    RunningTask,
    GptTaskCommand,
    Action,
    ActiveTasks,
    CommandResult,
    TaskSpec,
)
from tasks.flights.flight_price_watcher import flight_task
from tasks.reminders.reminder_service import reminder_task

TASK_TYPES: dict[str, TaskSpec] = {
    reminder_task.task_type_name: reminder_task,
    flight_task.task_type_name: flight_task,
}


async def execute_command(
    ctx: restate.Context,
    session_id: str,
    active_tasks: ActiveTasks,
    command: GptTaskCommand,
) -> CommandResult:
    """
    Interprets the command and generates the appropriate response.
    """
    try:
        match command.action:
            case Action.CREATE:
                task_opts = TaskOpts(**command.model_dump())

                if task_opts.task_name in active_tasks.tasks:
                    raise TerminalError(f"Task with name {task_opts.task_name} already exists.")

                task_id = await start_task(ctx, session_id, task_opts)

                new_active_tasks = active_tasks.model_copy()
                new_active_tasks.tasks[task_opts.task_name] = RunningTask(task_id=task_id, **command.model_dump())
                return CommandResult(
                    new_active_tasks=new_active_tasks,
                    task_message=f"The task '{task_opts.task_name}' of type {task_opts.task_type} has been successfully created in the system: {json.dumps(task_opts.params, indent=4)}",
                )

            case Action.CANCEL:
                task = active_tasks.tasks.get(command.task_name)
                if task is None:
                    return CommandResult(task_message=f"No task with name '{command.task_name}' is currently active.")

                await cancel_task(ctx, task.task_type, task.task_id)

                new_active_tasks = active_tasks.model_copy()
                del new_active_tasks.tasks[command.task_name]
                return CommandResult(
                    new_active_tasks=new_active_tasks,
                    task_message=f"Removed task '{command.task_name}'",
                )

            case Action.LIST:
                return CommandResult(task_message="tasks = " + active_tasks.model_dump_json(indent=4))

            case Action.STATUS:
                task = active_tasks.tasks.get(command.task_name)
                if task is None:
                    return CommandResult(task_message=f"No task with name '{command.task_name}' is currently active.")

                status = await get_task_status(ctx, task.task_type, task.task_id)
                return CommandResult(task_message=f"{command.task_name}.status = {json.dumps(status, indent=4)}")

            case Action.OTHER:
                return CommandResult()
            case _:
                raise ValueError(f"Unknown action type")

    except Exception as e:
        if not isinstance(e, restate.vm.SuspendedException):
            raise TerminalError(f"Failed to interpret command: {str(e)}\nCommand:\n{command}")
        else:
            raise e


async def start_task(ctx: restate.Context, session_id: str, task_opts: TaskOpts) -> str:
    task = TASK_TYPES.get(task_opts.task_type)
    if not task:
        raise ValueError(f"Unknown task type: {task_opts.task_type}")

    task_params = task.params_parser(task_opts.params)
    task_id = await ctx.run("task_id", lambda: str(uuid.uuid4()))

    ctx.service_send(
        task_executor.execute,
        {
            "task_name": task_opts.task_name,
            "task_service_name": task.task_service_name,
            "task_params": task_params.model_dump_json(),
            "task_id": task_id,
            "session_id": session_id,
        },
    )

    return task_id


async def cancel_task(ctx: restate.Context, task_type: str, task_id: str) -> None:
    task = TASK_TYPES.get(task_type)
    if not task:
        raise ValueError(f"Can't cancel task type for task ID {task_id} - Unknown task type: {task_type}")

    # Retrieve the invocation ID
    handle = ctx.workflow_send(task.task_handlers.run, task_id, None)
    ctx.cancel_invocation(await handle.invocation_id())


async def get_task_status(ctx: restate.Context, task_type: str, workflow_id: str) -> Any:
    task = TASK_TYPES.get(task_type)
    if not task:
        raise ValueError(f"Can't get task status for task ID {workflow_id} - Unknown task type: {task_type}")

    return await ctx.workflow_call(task.task_handlers.get_current_status, workflow_id, None)
