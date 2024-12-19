import logging
import uuid

from pydantic import BaseModel
from restate import Context, Service

logging.basicConfig(level=logging.INFO, format='[%(asctime)s] [%(process)d] [%(levelname)s] - %(message)s')


class CarRentalRequest(BaseModel):
    pickup_location: str
    rental_date: str


car_rental_service = Service("carRentals")


@car_rental_service.handler()
async def reserve(ctx: Context, request: CarRentalRequest) -> str:
    # this should implement the communication with the rental
    # provider's APIs
    # just return a mock random id representing the reservation
    booking_id = str(uuid.uuid4())
    logging.info(f"Car rental reservation created with id: {booking_id}")
    return booking_id


@car_rental_service.handler()
async def confirm(ctx: Context, booking_id: str):
    # this should implement the communication with the rental
    # provider's APIs
    logging.info(f"Car rental reservation confirmed with id: {booking_id}")


@car_rental_service.handler()
async def cancel(ctx: Context, booking_id: str):
    # this should implement the communication with the rental
    # provider's APIs
    logging.info(f"Car rental reservation cancelled with id: {booking_id}")
