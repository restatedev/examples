from typing import TypedDict, List, Optional


class PurchaseTicketRequest(TypedDict):
    ticketId: str
    concertDateTime: str
    price: float
    customerEmail: str


class SubscriptionRequest(TypedDict):
    userId: str
    creditCard: str
    subscriptions: List[str]


class SubscriptionResult(TypedDict):
    success: bool
    paymentRef: str


class PaymentRequest(TypedDict):
    amount: int
    currency: str
    customerId: str
    orderId: str


class PaymentResult(TypedDict):
    success: bool
    transactionId: Optional[str]
    errorMessage: Optional[str]


class ConfirmationRequest(TypedDict):
    id: str
    result: PaymentResult