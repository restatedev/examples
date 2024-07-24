import uuid
from typing import TypedDict, List
from restate.context import ObjectContext, Serde
from restate.service import Service

from example.utils.email_client import EmailClient
from example.utils.payment_client import PaymentClient


class Order(TypedDict):
    user_id: str
    tickets: List[str]


payment_client = PaymentClient()
email_client = EmailClient()

checkout = Service("checkout")


@checkout.handler()
async def handle(ctx: ObjectContext, order: Order) -> bool:
    total_price = len(order['tickets']) * 40

    idempotency_key = await ctx.run("idempotency_key", lambda: str(uuid.uuid4()))

    async def pay():
        return await payment_client.call(idempotency_key, total_price)
    success = await ctx.run("payment", pay)

    if success:
        await ctx.run("send_success_email", lambda: email_client.notify_user_of_payment_success(order['user_id']))
    else:
        await ctx.run("send_failure_email", lambda: email_client.notify_user_of_payment_failure(order['user_id']))

    return success
