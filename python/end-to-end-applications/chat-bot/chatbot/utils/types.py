from dataclasses import dataclass
from enum import Enum
from typing import TypedDict, Optional


@dataclass
class TaskOpts:
    name: str
    workflow_name: str
    params: dict


class TaskResult(TypedDict):
    task_name: str
    result: str


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
    workflow_id: str
    workflow: str
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
