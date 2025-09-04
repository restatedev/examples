from typing import List, Optional

from pydantic import BaseModel, ConfigDict
from pydantic.alias_generators import to_camel as camelize


class PurchaseTicketRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True, alias_generator=camelize)

    ticket_id: str
    concert_date: str
    price: float
    customer_email: str


class SubscriptionRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True, alias_generator=camelize)

    user_id: str
    credit_card: str
    subscriptions: List[str]


class SubscriptionResult(BaseModel):
    model_config = ConfigDict(populate_by_name=True, alias_generator=camelize)

    success: bool
    payment_ref: str


class PaymentRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True, alias_generator=camelize)

    amount: int
    currency: str
    customer_id: str
    order_id: str


class PaymentResult(BaseModel):
    model_config = ConfigDict(populate_by_name=True, alias_generator=camelize)

    success: bool
    transaction_id: str | None = None
    error_message: str | None = None


class ConfirmationRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True, alias_generator=camelize)

    id: str
    result: PaymentResult
