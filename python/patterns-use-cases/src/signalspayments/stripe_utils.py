import stripe
from pydantic import BaseModel
from restate.exceptions import TerminalError

stripe_secret_key = "sk_test_..."
webhook_secret = "whsec_..."

stripe.api_key = stripe_secret_key

RESTATE_CALLBACK_ID = "restate_callback_id"


class PaymentRequest(BaseModel):
    amount: int
    payment_method_id: str
    delayed_status: bool = False


def is_payment_intent(event: stripe.Event):
    return event['type'].startswith("payment_intent")


def parse_webhook_call(request_body, signature):
    if not signature:
        raise TerminalError("Missing 'stripe-signature' header.", status_code=400)
    try:
        return stripe.Webhook.construct_event(
            payload=request_body,
            sig_header=signature,
            secret=webhook_secret
        )
    except Exception as err:
        raise TerminalError(f"Webhook Error: {err}", status_code=400)


async def create_payment_intent(request) -> dict:
    request_options = {
        'idempotency_key': request['idempotency_key'],
    }

    try:
        payment_intent = stripe.PaymentIntent.create(
            amount=request['amount'],
            currency="usd",
            payment_method=request['payment_method_id'],
            confirm=True,
            confirmation_method="automatic",
            return_url="https://restate.dev/",
            metadata={
                RESTATE_CALLBACK_ID: request['intent_webhook_id'],
            },
            **request_options
        )

        if request.get('delayed_status'):
            payment_intent['status'] = "processing"

        return payment_intent
    except stripe.error.CardError as error:
        payment_intent = error.error.payment_intent
        if request.get('delayed_status') and payment_intent:
            payment_intent['status'] = "processing"
            return payment_intent
        else:
            raise TerminalError(f"Payment declined: {payment_intent.get('status')} - {error.user_message}")
    except Exception as error:
        raise error


def ensure_success(status):
    if status == "succeeded":
        return
    elif status in ["requires_payment_method", "canceled"]:
        raise TerminalError(f"Payment declined: {status}")
    else:
        raise Exception(f"Unhandled status: {status}")


def verify_payment_request(request: PaymentRequest):
    if not request.amount or request.amount == 0:
        raise TerminalError("'amount' missing or zero in request")
    if not request.payment_method_id or request.payment_method_id == "":
        raise TerminalError("'paymentMethodId' missing in request")
