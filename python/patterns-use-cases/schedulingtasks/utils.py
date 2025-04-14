import logging

from pydantic import BaseModel

logging.basicConfig(level=logging.INFO, format='[%(asctime)s] [%(process)d] [%(levelname)s] - %(message)s')
logger = logging.getLogger(__name__)

class StripeData(BaseModel):
    id: str
    customer: str

class StripeEvent(BaseModel):
    type: str
    created: int
    data: StripeData

def send_reminder_email(event):
    logging.info(f"Payment reminder sent for event: {event.data.id}")

def escalate_to_human(event):
    logging.info(f"Escalating invoice to support team for event: {event.data.id}")
