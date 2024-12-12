from restate import VirtualObject, ObjectContext
from restate.exceptions import TerminalError

from ordering.order_workflow import Order
import ordering.order_workflow as order_workflow
import ordering.driver_matcher as driver_matcher
import ordering.driver_digital_twin as driver_digital_twin
import ordering.order_status as order_status
from ordering.utils import geo
from ordering.types.types import DeliveryInformation, Location

from ordering.types.types import DEMO_REGION

delivery_manager = VirtualObject("delivery-manager")

DELIVERY_INFO = "DELIVERY_INFO"


@delivery_manager.handler()
async def start(ctx: ObjectContext, order: Order):
    restaurant_location, customer_location = await ctx.run("locations", lambda: [
        geo.random_location(),
        geo.random_location()
    ])

    # Store the delivery information in Restate's state store
    delivery_info: DeliveryInformation = {
        "order_id": order["id"],
        "restaurant_id": order["restaurant_id"],
        "restaurant_location": restaurant_location,
        "customer_location": customer_location,
        "order_picked_up": False,
    }
    ctx.set(DELIVERY_INFO, delivery_info)

    # Acquire a driver
    driver_promise_id, driver_promise = ctx.awakeable()

    ctx.object_send(driver_matcher.request_driver_for_delivery, DEMO_REGION, {"promise_id": driver_promise_id})

    # Wait until the driver pool service has located a driver
    driver_id = await driver_promise

    # Assign the driver to the job
    await ctx.object_call(driver_digital_twin.assign_delivery_job, driver_id, {
        "delivery_id": ctx.key(),
        "restaurant_id": order["restaurant_id"],
        "restaurant_location": delivery_info["restaurant_location"],
        "customer_location": delivery_info["customer_location"],
    })

    await ctx.workflow_call(order_workflow.selected_driver, order["id"], arg=None)


@delivery_manager.handler()
async def notify_delivery_pickup(ctx: ObjectContext):
    delivery = await ctx.get(DELIVERY_INFO)
    if delivery is None:
        raise TerminalError("No delivery information found")

    delivery["order_picked_up"] = True
    ctx.set(DELIVERY_INFO, delivery)

    ctx.workflow_send(order_workflow.signal_driver_at_restaurant, delivery["order_id"], arg=None)


@delivery_manager.handler()
async def notify_delivery_delivered(ctx: ObjectContext):
    delivery = await ctx.get(DELIVERY_INFO)
    if delivery is None:
        raise TerminalError("No delivery information found")
    ctx.clear(DELIVERY_INFO)

    ctx.workflow_send(order_workflow.signal_delivery_finished, delivery["order_id"], arg=None)


@delivery_manager.handler("handleDriverLocationUpdate")
async def handle_driver_location_update(ctx: ObjectContext, location: Location):
    delivery = await ctx.get(DELIVERY_INFO)

    if delivery["order_picked_up"]:
        eta = geo.calculate_eta_millis(location, delivery["customer_location"])
    else:
        eta = (geo.calculate_eta_millis(location, delivery["restaurant_location"]) +
               geo.calculate_eta_millis(delivery["restaurant_location"], delivery["customer_location"]))

    ctx.object_send(order_status.set_eta, delivery["order_id"], eta)
