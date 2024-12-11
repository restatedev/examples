from typing import TypedDict
from enum import Enum

DEMO_REGION = "San Jose (CA)"


class Status(str, Enum):
    NEW = "NEW"
    CREATED = "CREATED"
    SCHEDULED = "SCHEDULED"
    IN_PREPARATION = "IN_PREPARATION"
    SCHEDULING_DELIVERY = "SCHEDULING_DELIVERY"
    WAITING_FOR_DRIVER = "WAITING_FOR_DRIVER"
    IN_DELIVERY = "IN_DELIVERY"
    DELIVERED = "DELIVERED"
    REJECTED = "REJECTED"
    CANCELLED = "CANCELLED"


class Location(TypedDict):
    long: float
    lat: float


class DeliveryInformation(TypedDict):
    order_id: str
    restaurant_id: str
    restaurant_location: Location
    customer_location: Location
    order_picked_up: bool


class DeliveryRequest(TypedDict):
    delivery_id: str
    restaurant_id: str
    restaurant_location: Location
    customer_location: Location


class PendingDelivery(TypedDict):
    promise_id: str


class DeliveryState(TypedDict):
    current_delivery: DeliveryRequest
    order_picked_up: bool


class DriverStatus(str, Enum):
    IDLE = "IDLE"
    WAITING_FOR_WORK = "WAITING_FOR_WORK"
    DELIVERING = "DELIVERING"
