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
from typing import Dict, Any

from restate.exceptions import TerminalError

from chatbot.tasks import task_executor
from chatbot.utils.types import (
    TaskOpts,
    RunningTask,
    GptTaskCommand,
    Action,
    ActiveTasks,
)
from chatbot.tasks.flights.flight_price_watcher import flight_task
from chatbot.tasks.reminders.reminder_service import reminder_task
from chatbot.utils.types import TaskSpec

TASK_TYPES: Dict[str, TaskSpec] = {
    reminder_task.task_type_name: reminder_task,
    flight_task.task_type_name: flight_task,
}


async def execute_command(
    ctx: restate.Context,
    session_id: str,
    active_tasks: ActiveTasks,
    command: GptTaskCommand,
):
    """
    Interprets the command and generates the appropriate response.
    """
    try:
        if command.action == Action.CREATE:
            name = check_action_field(Action.CREATE, command, "task_name")
            task_type = check_action_field(Action.CREATE, command, "task_type")
            params = check_action_field(Action.CREATE, command, "task_spec")

            if name in active_tasks.tasks:
                raise ValueError(f"Task with name {name} already exists.")

            task_id = await start_task(
                ctx, session_id, TaskOpts(name=name, task_type=task_type, params=params)
            )

            new_active_tasks = active_tasks.model_copy()
            new_active_tasks.tasks[name] = RunningTask(
                name=name, task_id=task_id, task_type=task_type, params=params
            )
            return {
                "new_active_tasks": new_active_tasks,
                "task_message": f"The task '{name}' of type {task_type} has been successfully created in the system: {json.dumps(params, indent=4)}",
            }

        if command.action == Action.CANCEL:
            name = check_action_field(Action.CANCEL, command, "task_name")
            task = active_tasks.tasks.get(name)
            if task is None:
                return {
                    "new_active_tasks": ActiveTasks(tasks={}),
                    "task_message": f"No task with name '{name}' is currently active.",
                }

            await cancel_task(ctx, task["task_type"], task["task_id"])

            new_active_tasks = active_tasks.model_copy()
            del new_active_tasks.tasks[name]
            return {
                "new_active_tasks": new_active_tasks,
                "task_message": f"Removed task '{name}'",
            }

        if command.action == Action.LIST:
            return {
                "new_active_tasks": ActiveTasks(tasks={}),
                "task_message": "tasks = " + active_tasks.model_dump_json(indent=4),
            }

        if command.action == Action.STATUS:
            name = check_action_field(Action.STATUS, command, "task_name")
            task = active_tasks.tasks.get(name)
            if task is None:
                return {
                    "new_active_tasks": ActiveTasks(tasks={}),
                    "task_message": f"No task with name '{name}' is currently active.",
                }

            status = await get_task_status(ctx, task.task_type, task.task_id)
            return {
                "new_active_tasks": ActiveTasks(tasks={}),
                "task_message": f"{name}.status = {json.dumps(status, indent=4)}",
            }

        if command.action == Action.OTHER:
            return {"new_active_tasks": ActiveTasks(tasks={}), "task_message": None}

    except TerminalError as e:
        # pylint: disable=raise-missing-from
        # print stacktrace
        print(e)
        raise TerminalError(
            f"Failed to interpret command: {str(e)}\nCommand:\n{command}"
        )


def check_action_field(action: Action, command: GptTaskCommand, field_name: str):
    value = getattr(command, field_name, None)
    if value is None:
        raise ValueError(f"Missing required field '{field_name}' for action '{action}'")
    return value


async def start_task(ctx: restate.Context, session_id: str, task_opts: TaskOpts) -> str:
    task = TASK_TYPES.get(task_opts.task_type)
    if not task:
        raise ValueError(f"Unknown task type: {task_opts.task_type}")

    task_params = task.params_parser(task_opts.name, task_opts.params)
    task_id = await ctx.run("task_id", lambda: str(uuid.uuid4()))

    ctx.service_send(
        task_executor.execute,
        {
            "task_name": task_opts.name,
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
        raise ValueError(
            f"Can't cancel task type for task ID {task_id} - Unknown task type: {task_type}"
        )

    await ctx.workflow_call(task.task_handlers.cancel, task_id, None)


async def get_task_status(
    ctx: restate.Context, task_type: str, workflow_id: str
) -> Any:
    task = TASK_TYPES.get(task_type)
    if not task:
        raise ValueError(
            f"Can't get task status for task ID {workflow_id} - Unknown task type: {task_type}"
        )

    return await ctx.workflow_call(
        task.task_handlers.get_current_status, workflow_id, None
    )
