import logging
import uuid

from pydantic import BaseModel

logging.basicConfig(level=logging.INFO, format='[%(asctime)s] [%(process)d] [%(levelname)s] - %(message)s')
logger = logging.getLogger(__name__)


class FlightBookingRequest(BaseModel):
    flight_id: str
    passenger_name: str


async def reserve(request: FlightBookingRequest) -> str:
    """Reserves a flight."""
    booking_id = str(uuid.uuid4())
    logger.info(f"Flight reservation created with id: {booking_id}")
    return booking_id

async def confirm(flight_booking_id: str):
    """Confirms a flight booking."""
    logger.info(f"Flight reservation confirmed with id: {flight_booking_id}")

async def cancel(flight_booking_id: str):
    """Cancels a flight booking."""
    logger.info(f"Flight reservation cancelled with id: {flight_booking_id}")