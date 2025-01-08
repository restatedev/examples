import uuid

import restate
from pydantic import BaseModel
from restate import Service, Context
from utils import create_recurring_payment, create_subscription

"""
Restate lets you implement resilient applications.
Restate ensures handler code runs to completion despite failures:
 - Automatic retries
 - Restate tracks the progress of execution, and prevents re-execution of completed work on retries
 - Regular code and control flow, no custom DSLs

Applications consist of services with handlers that can be called over HTTP or Kafka.
"""
subscription_service = Service("SubscriptionService")


class SubscriptionRequest(BaseModel):
    user_id: str
    credit_card: str
    subscriptions: list[str]


@subscription_service.handler()
async def add(ctx: Context, req: SubscriptionRequest):
    # Stable idempotency key: Restate persists the result of
    # all `ctx` actions and recovers them after failures
    payment_id = await ctx.run("payment id", lambda: str(uuid.uuid4()))

    # Retried in case of timeouts, API downtime, etc.
    pay_ref = await ctx.run("recurring payment",
                            lambda: create_recurring_payment(req.credit_card, payment_id))

    # Persists successful subscriptions and skip them on retries
    for subscription in req.subscriptions:
        await ctx.run("subscription",
                      lambda: create_subscription(req.user_id, subscription, pay_ref))


# Create an HTTP endpoint to serve your services on port 9080
# or use .handler() to run on Lambda, Deno, Bun, Cloudflare Workers, ...
app = restate.app([subscription_service])

"""
Check the README to learn how to run Restate.
Then invoke this function and see in the log how it recovers.
Each action (e.g. "created recurring payment") is only logged once across all retries.
Retries did not re-execute the successful operations.

curl localhost:8080/SubscriptionService/add -H 'content-type: application/json' -d \
'{
    "user_id": "Sam Beckett",
    "credit_card": "1234-5678-9012-3456",
    "subscriptions" : ["Netflix", "Disney+", "HBO Max"]
}'
"""