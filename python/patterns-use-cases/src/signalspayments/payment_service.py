import json
import logging
import uuid

import restate
from restate import Context, Service
from restate.exceptions import TerminalError
import stripe_utils
from stripe_utils import (PaymentRequest, verify_payment_request, create_payment_intent,
                          RESTATE_CALLBACK_ID, is_payment_intent, parse_webhook_call)

logging.basicConfig(level=logging.INFO, format='[%(asctime)s] [%(process)d] [%(levelname)s] - %(message)s')
logger = logging.getLogger(__name__)

payment_service = Service("payments")


@payment_service.handler("processPayment")
async def process_payment(ctx: Context, req: PaymentRequest):
    verify_payment_request(req)

    # Generate a deterministic idempotency key
    idempotency_key = await ctx.run("idempotency key", lambda: str(uuid.uuid4()))

    # Initiate a listener for external calls for potential webhook callbacks
    intent_webhook_id, intent_promise = ctx.awakeable()

    # Make a synchronous call to the payment service
    async def payment_intent() -> dict:
        return await create_payment_intent({
            'payment_method_id': req.payment_method_id,
            'amount': req.amount,
            'idempotency_key': idempotency_key,
            'intent_webhook_id': intent_webhook_id,
            'delayed_status': req.delayed_status,
        })

    payment_intent = await ctx.run("stripe call", payment_intent)

    if payment_intent['status'] != "processing":
        # The call to Stripe completed immediately / synchronously: processing done
        logger.info(f"Request {idempotency_key} was processed synchronously!")
        stripe_utils.ensure_success(payment_intent['status'])
        return

    # We did not get the response on the synchronous path, talking to Stripe.
    # No worries, Stripe will let us know when it is done processing via a webhook.
    logger.info(f"Payment intent for {idempotency_key} still processing, awaiting webhook call...")

    # We will now wait for the webhook call to complete this promise.
    # Check out the handler below.
    processed_payment_intent = await intent_promise

    logger.info(f"Webhook call for {idempotency_key} received!")
    stripe_utils.ensure_success(processed_payment_intent['status'])


@payment_service.handler("processWebhook")
async def process_webhook(ctx: Context):
    req = ctx.request()
    sig = req.headers.get("stripe-signature")
    event = parse_webhook_call(req.body, sig)

    if not is_payment_intent(event):
        logger.info(f"Unhandled event type {event['type']}")
        return {'received': True}

    payment_intent = event['data']['object']
    logger.info("Received webhook call for payment intent %s", json.dumps(payment_intent))

    webhook_promise = payment_intent['metadata'].get(RESTATE_CALLBACK_ID)
    if not webhook_promise:
        raise TerminalError(f"Missing callback property: {RESTATE_CALLBACK_ID}", status_code=404)

    ctx.resolve_awakeable(webhook_promise, payment_intent)
    return {'received': True}


app = restate.app([payment_service])
