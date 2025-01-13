import logging
import uuid

from pydantic import BaseModel
from restate import Context, Service

logging.basicConfig(level=logging.INFO, format='[%(asctime)s] [%(process)d] [%(levelname)s] - %(message)s')
logger = logging.getLogger(__name__)


class FlightBookingRequest(BaseModel):
    flight_id: str
    passenger_name: str


service = Service("flights")


@service.handler()
async def reserve(ctx: Context, request: FlightBookingRequest) -> str:
    # this should implement the communication with the flight
    # provider's APIs
    # just return a mock random id representing the reservation
    booking_id = str(uuid.uuid4())
    logger.info(f"Flight reservation created with id: {booking_id}")
    return booking_id


@service.handler()
async def confirm(ctx: Context, flight_booking_id: str):
    # this should implement the communication with the flight
    # provider's APIs
    logger.info(f"Flight reservation confirmed with id: {flight_booking_id}")


@service.handler()
async def cancel(ctx: Context, flight_booking_id: str):
    # this should implement the communication with the flight
    # provider's APIs
    logger.info(f"Flight reservation cancelled with id: {flight_booking_id}")
