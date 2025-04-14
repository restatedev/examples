import logging
import random

from pydantic import BaseModel
from restate.exceptions import TerminalError

logging.basicConfig(
    level=logging.INFO,
    format="[%(asctime)s] [%(process)d] [%(levelname)s] - %(message)s",
)
logger = logging.getLogger(__name__)


class PaymentInfo(BaseModel):
    card_number: str
    amount: float


async def charge(payment_info: PaymentInfo, payment_id: str):
    if random.random() < 0.5:
        logger.error(
            "[👻 SIMULATED] This payment should never be accepted! Aborting booking."
        )
        raise TerminalError("[👻 SIMULATED] This payment could not be accepted!")
    if random.random() < 0.8:
        logger.error("[👻 SIMULATED] A payment failure happened! Will retry...")
        raise Exception("[👻 SIMULATED] A payment failure happened! Will retry...")
    logger.info(f"Payment {payment_id} processed")


async def refund(payment_id: str):
    logger.info(f"Payment {payment_id} refunded")
