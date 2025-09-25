import logging

from pydantic import BaseModel

logger = logging.getLogger(__name__)


class FlightRequest(BaseModel):
    flight_id: str
    passenger_name: str


async def book(customer_id: str, flight: FlightRequest):
    # this should implement the communication with the flight
    # provider's APIs
    logging.info(f"Flight reservation created for customer: {customer_id}")


async def cancel(customer_id: str):
    # this should implement the communication with the flight
    # provider's APIs
    logging.info(f"Flight reservation cancelled for customer: {customer_id}")
