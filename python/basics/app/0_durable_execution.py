import uuid

import restate
from pydantic import BaseModel
from restate import Service, Context
from utils import create_recurring_payment, create_subscription


class SubscriptionRequest(BaseModel):
    user_id: str
    credit_card: str
    subscriptions: list[str]


"""
 Restate helps you implement resilient applications:
  - Automatic retries
  - Tracking progress of execution and preventing re-execution of completed work on retries
  - Providing durable building blocks like timers, promises, and messaging: recoverable and revivable anywhere

 Applications consist of services with handlers that can be called over HTTP or Kafka.
 Handlers can be called at http://restate:8080/ServiceName/handlerName

 Restate persists and proxies HTTP requests to handlers and manages their execution:

 ┌────────┐   ┌─────────┐   ┌────────────────────────────┐
 │ HTTP   │ → │ Restate │ → │ Restate Service (with SDK) │
 │ Client │ ← │         │ ← │   handler1(), handler2()   │
 └────────┘   └─────────┘   └────────────────────────────┘

 The SDK lets you implement handlers with regular code and control flow.
 Handlers have access to a Context that provides durable building blocks that get persisted in Restate.
 Whenever a handler uses the Restate Context, an event gets persisted in Restate's log.
 After a failure, a retry is triggered and this log gets replayed to recover the state of the handler.
"""
subscription_service = Service("SubscriptionService")


@subscription_service.handler()
async def add(ctx: Context, req: SubscriptionRequest):
    # Restate persists the result of all `ctx` actions and recovers them after failures
    # For example, generate a stable idempotency key:
    payment_id = str(ctx.uuid())

    # ctx.run_typed persists results of successful actions and skips execution on retries
    # Failed actions (timeouts, API downtime, etc.) get retried
    pay_ref = await ctx.run_typed(
        "recurring payment",
        create_recurring_payment,
        credit_card=req.credit_card,
        payment_id=payment_id
    )

    for subscription in req.subscriptions:
        await ctx.run_typed(
            "subscription",
            create_subscription,
            user_id=req.user_id,
            subscription=subscription,
            payment_ref=pay_ref
        )


# Define 'app' used by hypercorn (or other HTTP servers) to serve the SDK
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
