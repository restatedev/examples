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
from pydantic import BaseModel


class ChatEntry(BaseModel):
    role: Literal["user", "assistant", "system"]
    content: str
    timestamp: int | None = None


class ChatHistory(BaseModel):
    entries: list[ChatEntry] = list()


class TaskOpts(BaseModel):
    name: str
    task_type: str
    params: dict


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
    task_spec: dict[str, Any] | None = None


class RunningTask(BaseModel):
    name: str
    task_id: str
    task_type: str
    params: dict


class ActiveTasks(BaseModel):
    tasks: dict[str, RunningTask] = dict()


class RoundTripRouteDetails(BaseModel):
    start: str
    destination: str
    outbound_date: str
    return_date: str
    travel_class: str


class FlightPriceOpts(BaseModel):
    name: str
    trip: RoundTripRouteDetails
    price_threshold_usd: float
    description: str | None = None


class ReminderOpts(BaseModel):
    timestamp: int
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
    params_parser: Callable[[str, dict], P]
