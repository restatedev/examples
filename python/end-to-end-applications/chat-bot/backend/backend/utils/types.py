from datetime import datetime

import restate
from enum import Enum
from typing import (
    Literal,
    TypeVar,
    Callable,
    Generic,
    Any,
    Awaitable,
)
from pydantic import BaseModel, Field

from tasks.flights.utils.utils import parse_currency


class ChatEntry(BaseModel):
    role: Literal["user", "assistant", "system"]
    content: str
    timestamp: int | None = None


class ChatHistory(BaseModel):
    entries: list[ChatEntry] = list()


class TaskOpts(BaseModel):
    task_name: str
    task_type: str
    params: dict[str, Any] | None


class TaskResult(BaseModel):
    task_name: str
    result: str
    timestamp: int


class Action(Enum):
    CREATE = "create"
    CANCEL = "cancel"
    LIST = "list"
    STATUS = "status"
    OTHER = "other"


class GptTaskCommand(BaseModel):
    action: Action
    message: str
    task_name: str | None = None
    task_type: str | None = None
    params: dict[str, Any]


class RunningTask(BaseModel):
    task_name: str
    task_id: str
    task_type: str
    params: dict


class ActiveTasks(BaseModel):
    tasks: dict[str, RunningTask] = dict()


class CommandResult(BaseModel):
    new_active_tasks: ActiveTasks = ActiveTasks()
    task_message: str | None = None


class FlightPriceOpts(BaseModel):
    start_airport: str
    destination_airport: str
    outbound_date: str
    return_date: str
    travel_class: str
    price_threshold: float
    price_threshold_usd: float = Field(
        default_factory=lambda data: parse_currency(data["price_threshold"])
    )
    description: str | None = None


class ReminderOpts(BaseModel):
    date: str
    timestamp: int = Field(
        default_factory=lambda data: int(
            datetime.fromisoformat(data["date"]).timestamp() * 1000
        )
    )
    description: str | None = None


P = TypeVar("P")


class TaskHandlers(BaseModel, Generic[P]):
    """
    A task workflow is a set of functions that define how a task is run,
    cancelled and its current status.
    """

    run: Callable[[restate.WorkflowContext, P], Awaitable[str]]
    get_current_status: Callable[[restate.WorkflowSharedContext, None], Awaitable[Any]]


class TaskSpec(BaseModel, Generic[P]):
    """
    Task specification
    """

    task_service_name: str
    task_type_name: str
    task_handlers: TaskHandlers[P]
    params_parser: Callable[[dict], P]
