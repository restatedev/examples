import uuid
from datetime import timedelta
from typing import TypedDict

from restate import Workflow, WorkflowContext, WorkflowSharedContext

from ordering.clients.payment_client import PaymentClient
from ordering.clients.restaurant_client import RestaurantClient
from ordering.types.types import Status
import ordering.delivery_manager as delivery_manager

payment_client = PaymentClient()
restaurant_client = RestaurantClient()

order_workflow = Workflow("order-workflow")


class Product(TypedDict):
    product_id: str
    description: str
    quantity: int


class Order(TypedDict):
    id: str
    restaurant_id: str
    products: list[Product]
    total_cost: int
    delivery_delay: int


@order_workflow.main()
async def run(ctx: WorkflowContext, order: Order):
    id, total_cost, delivery_delay = (
        ctx.key(),
        order["total_cost"],
        order["delivery_delay"],
    )

    ctx.set("status", Status.CREATED)

    token = str(ctx.uuid())
    paid = await ctx.run_typed("payment", payment_client.charge, token=token, amount=total_cost)

    if not paid:
        ctx.set("status", Status.REJECTED)
        return

    ctx.set("status", Status.SCHEDULED)
    await ctx.sleep(timedelta(milliseconds=delivery_delay))

    await ctx.run_typed("prepare", restaurant_client.prepare, order_id=id)
    ctx.set("status", Status.IN_PREPARATION)

    await ctx.promise("preparation_finished").value()
    ctx.set("status", Status.SCHEDULING_DELIVERY)

    delivery_id = str(ctx.uuid())
    ctx.object_send(delivery_manager.start, delivery_id, arg=order)

    await ctx.promise("driver_selected").value()
    ctx.set("status", Status.WAITING_FOR_DRIVER)
    await ctx.promise("driver_at_restaurant").value()
    ctx.set("status", Status.IN_DELIVERY)
    await ctx.promise("delivery_finished").value()
    ctx.set("status", Status.DELIVERED)


@order_workflow.handler(name="finishedPreparation")
async def finished_preparation(ctx: WorkflowSharedContext):
    await ctx.promise("preparation_finished").resolve(None)


@order_workflow.handler()
async def selected_driver(ctx: WorkflowSharedContext):
    await ctx.promise("driver_selected").resolve(None)


@order_workflow.handler()
async def signal_driver_at_restaurant(ctx: WorkflowSharedContext):
    await ctx.promise("driver_at_restaurant").resolve(None)


@order_workflow.handler()
async def signal_delivery_finished(ctx: WorkflowSharedContext):
    await ctx.promise("delivery_finished").resolve(None)


@order_workflow.handler()
async def get_status(ctx: WorkflowSharedContext):
    return await ctx.get("status")
