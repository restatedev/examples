import logging

from pydantic import BaseModel
from restate.exceptions import TerminalError

logger = logging.getLogger(__name__)


class HotelRequest(BaseModel):
    arrival_date: str
    departure_date: str


async def book(customer_id: str, hotel: HotelRequest):
    # this should implement the communication with the hotel
    # provider's APIs
    logger.error("[👻 SIMULATED] This hotel is fully booked!")
    raise TerminalError("[👻 SIMULATED] This hotel is fully booked!")


async def cancel(customer_id: str):
    # this should implement the communication with the hotel
    # provider's APIs
    logging.info(f"Hotel reservation cancelled for customer: {customer_id}")
