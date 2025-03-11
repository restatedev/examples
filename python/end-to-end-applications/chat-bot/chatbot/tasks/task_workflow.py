"""
defining new types of task workflows
"""

from dataclasses import dataclass
from typing import TypeVar, Generic, Any, Callable, Awaitable
from restate import WorkflowContext, WorkflowSharedContext

P = TypeVar('P')

class TaskWorkflow(Generic[P]):
    """
    A task workflow is a set of functions that define how a task is run,
    cancelled and its current status.
    """
    run: Callable[[Any, P], Awaitable[str]]
    cancel: Callable[[Any, None], Awaitable[None]]
    current_status: Callable[[Any, None], Awaitable[Any]]


    def __init__(self, run: Callable[[WorkflowContext, P], Awaitable[str]],
                 cancel: Callable[[WorkflowSharedContext, None], Awaitable[None]],
                 current_status: Callable[[WorkflowSharedContext, None], Awaitable[Any]]):
        self.run = run
        self.cancel = cancel
        self.current_status = current_status


@dataclass
class TaskSpec(Generic[P]):
    """
    Task specification
    """
    task_type_name: str
    task_workflow: TaskWorkflow[P]
    params_parser: Callable[[str, dict], P]
