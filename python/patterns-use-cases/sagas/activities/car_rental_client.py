import logging
import uuid

from pydantic import BaseModel

logging.basicConfig(level=logging.INFO, format='[%(asctime)s] [%(process)d] [%(levelname)s] - %(message)s')


class CarRentalRequest(BaseModel):
    pickup_location: str
    rental_date: str


async def reserve(request: CarRentalRequest) -> str:
    # this should implement the communication with the rental
    # provider's APIs
    # just return a mock random id representing the reservation
    booking_id = str(uuid.uuid4())
    logging.info(f"Car rental reservation created with id: {booking_id}")
    return booking_id

async def confirm(booking_id: str):
    # this should implement the communication with the rental
    # provider's APIs
    logging.info(f"Car rental reservation confirmed with id: {booking_id}")


async def cancel(booking_id: str):
    # this should implement the communication with the rental
    # provider's APIs
    logging.info(f"Car rental reservation cancelled with id: {booking_id}")
