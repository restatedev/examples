import logging

from pydantic import BaseModel

logger = logging.getLogger(__name__)


class CarRentalRequest(BaseModel):
    pickup_location: str
    rental_date: str


async def book(customer_id: str, car: CarRentalRequest):
    # this should implement the communication with the rental
    # provider's APIs
    logger.info(f"Car rental reservation created for customer: {customer_id}")


async def cancel(customer_id: str):
    # this should implement the communication with the rental
    # provider's APIs
    logger.info(f"Car rental reservation cancelled for customer: {customer_id}")
