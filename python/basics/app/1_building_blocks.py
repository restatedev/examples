import uuid
from datetime import timedelta

import restate

from app.utils import subscription_service, charge_bank_account

"""
RESTATE's DURABLE BUILDING BLOCKS

Restate turns familiar programming constructs into recoverable, distributed building blocks.
They get persisted in Restate, survive failures, and can be revived on another process.

No more need for retry/recovery logic, K/V stores, workflow orchestrators,
scheduler services, message queues, ...

The run handler below shows a catalog of these building blocks.
Look at the other examples in this project to see how to use them in examples.
"""

my_service = restate.Service("myService")


# This handler can be called over HTTP at http://restate:8080/myService/handlerName
# Use the context to access Restate's durable building blocks
@my_service.handler()
async def run(ctx: restate.Context):
    # ---
    # 1. IDEMPOTENCY: Add an idempotency key to the header of your requests
    # Restate deduplicates calls automatically. Nothing to do here.

    # ---
    # 2. DURABLE RPC: Call other services without manual retry and deduplication logic
    # Restate persists all requests and ensures execution till completion
    result = await ctx.object_call(subscription_service.create, "my-sub-123", "my-request")

    # ---
    # 3. DURABLE MESSAGING: send (delayed) messages to other services without deploying a message broker
    # Restate persists the timers and triggers execution
    ctx.object_send(subscription_service.cancel, "my-sub-123", "my-request")

    # ---
    # 4. DURABLE PROMISES: tracked by Restate, can be moved between processes and survive failures
    # Awakeables: block the workflow until notified by another handler
    awakeable_id, promise = ctx.awakeable()
    # Wait on the promise
    # If the process crashes while waiting, Restate will recover the promise somewhere else
    greeting_result = await promise
    # Another process can resolve the awakeable via its ID
    ctx.resolve_awakeable(awakeable_id, "hello")

    # ---
    # 5. DURABLE TIMERS: sleep or wait for a timeout, tracked by Restate and recoverable
    # When this runs on FaaS, the handler suspends and the timer is tracked by Restate
    # Example of durable recoverable sleep
    # If the service crashes two seconds later, Restate will invoke it after another 3 seconds
    await ctx.sleep(timedelta(seconds=5))
    # Example of scheduling a handler for later on
    ctx.object_send(
        subscription_service.cancel,
        "my-sub-123",
        "my-request",
        send_delay=timedelta(days=1),
    )

    # ---
    # 7. PERSIST RESULTS: avoid re-execution of actions on retries
    # Use this for non-deterministic actions or interaction with APIs, DBs, ...
    # For example, generate idempotency keys that are stable across retries
    # Then use these to call other APIs and let them deduplicate
    payment_deduplication_id = str(ctx.uuid())

    result = await ctx.run_typed("charge",
                                 charge_bank_account,
                                 payment_deduplication_id=payment_deduplication_id,
                                 amount=100)
