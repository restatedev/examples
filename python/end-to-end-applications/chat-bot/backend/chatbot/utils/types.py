import restate
from dataclasses import dataclass
from enum import Enum
from typing import TypedDict, Optional, Literal, TypeVar, Callable, Generic, Any, Awaitable

class ChatEntry(TypedDict):
    role: Literal["user", "assistant", "system"]
    content: str
    timestamp: int

@dataclass
class TaskOpts:
    name: str
    task_type: str
    params: dict


class TaskResult(TypedDict):
    task_name: str
    result: str
    timestamp: int


class Action(Enum):
    CREATE = "create"
    CANCEL = "cancel"
    LIST = "list"
    STATUS = "status"
    OTHER = "other"


@dataclass
class GptTaskCommand:
    action: Action
    message: str
    task_name: Optional[str] = None
    task_type: Optional[str] = None
    task_spec: Optional[dict] = None


class RunningTask(TypedDict):
    name: str
    task_id: str
    task_type: str
    params: dict


class RoundTripRouteDetails(TypedDict):
    start: str
    destination: str
    outbound_date: str
    return_date: str
    travel_class: str


class FlightPriceOpts(TypedDict):
    name: str
    trip: RoundTripRouteDetails
    price_threshold_usd: float
    description: str


class ReminderOpts(TypedDict):
    timestamp: int
    description: str


P = TypeVar('P')

@dataclass()
class TaskHandlers(Generic[P]):
    """
    A task workflow is a set of functions that define how a task is run,
    cancelled and its current status.
    """
    run: Callable[[restate.WorkflowContext, P], Awaitable[str]]
    cancel: Callable[[restate.WorkflowSharedContext, None], Awaitable[None]]
    get_current_status: Callable[[restate.WorkflowSharedContext, None], Awaitable[Any]]


@dataclass
class TaskSpec(Generic[P]):
    """
    Task specification
    """
    task_service_name: str
    task_type_name: str
    task_handlers: TaskHandlers[P]
    params_parser: Callable[[str, dict], P]