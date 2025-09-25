# Copyright (c) 2024 - Restate Software, Inc., Restate GmbH
#
# This file is part of the Restate Examples for the Node.js/TypeScript SDK,
# which is released under the MIT license.
#
# You can find a copy of the license in the file LICENSE
# in the root directory of this repository or package or at
# https://github.com/restatedev/examples/blob/main/LICENSE
from datetime import timedelta

from restate import VirtualObject, ObjectContext
import ordering.utils.geo as geo
from ordering.external.location_utils import update_location
from ordering.types.types import DEMO_REGION, DeliveryState
from ordering.clients.kafka_client import send_location_to_kafka
import ordering.driver_digital_twin as driver_digital_twin

# !!!SHOULD BE AN EXTERNAL APP ON THE DRIVER's PHONE!!! Simulated driver with application that
# interacts with the food ordering app. This is not really part of the food ordering application.
# This would actually be a mobile app that drivers use to accept delivery requests, and to set
# themselves as available.
#
# For simplicity, we implemented this with Restate.

ASSIGNED_DELIVERY = "assigned-delivery"
CURRENT_LOCATION = "current-location"

POLL_INTERVAL = timedelta(milliseconds=1000)
MOVE_INTERVAL = timedelta(milliseconds=1000)
PAUSE_BETWEEN_DELIVERIES = timedelta(milliseconds=2000)

mobile_app_object = VirtualObject("driver-mobile-app")


@mobile_app_object.handler("startDriver")
async def start_driver(ctx: ObjectContext):
    if await ctx.get(CURRENT_LOCATION) is not None:
        return

    print(f"Driver {ctx.key()} starting up")

    location = await ctx.run_typed("random_location", geo.random_location)
    ctx.set(CURRENT_LOCATION, location)
    await ctx.run_typed("sending_location_to_kafka", send_location_to_kafka, driver_id=ctx.key(), location=location)

    ctx.object_send(driver_digital_twin.set_driver_available, ctx.key(), DEMO_REGION)
    ctx.object_send(poll_for_work, ctx.key(), arg=None)


@mobile_app_object.handler()
async def poll_for_work(ctx: ObjectContext):
    optional_assigned_delivery = await ctx.object_call(driver_digital_twin.get_assigned_delivery, ctx.key(), arg=None)
    if optional_assigned_delivery is None:
        ctx.object_send(poll_for_work, ctx.key(), arg=None, send_delay=POLL_INTERVAL)
        return

    delivery = DeliveryState(current_delivery=optional_assigned_delivery, order_picked_up=False)
    ctx.set(ASSIGNED_DELIVERY, delivery)

    ctx.object_send(move, ctx.key(), arg=None, send_delay=MOVE_INTERVAL)


@mobile_app_object.handler()
async def move(ctx: ObjectContext):
    current_location = await ctx.get(CURRENT_LOCATION)
    assigned_delivery = await ctx.get(ASSIGNED_DELIVERY)

    next_target = (
        assigned_delivery["current_delivery"]["customer_location"]
        if assigned_delivery["order_picked_up"]
        else assigned_delivery["current_delivery"]["restaurant_location"]
    )

    new_location, arrived = update_location(current_location, next_target)

    ctx.set(CURRENT_LOCATION, new_location)
    await ctx.run_typed(
        "send_location_to_kafka",
        send_location_to_kafka,
        driver_id=ctx.key(),
        location=current_location,
    )

    if arrived:
        if assigned_delivery["order_picked_up"]:
            ctx.clear(ASSIGNED_DELIVERY)
            await ctx.object_call(driver_digital_twin.notify_delivery_delivered, ctx.key(), arg=None)
            await ctx.sleep(PAUSE_BETWEEN_DELIVERIES)
            ctx.object_send(driver_digital_twin.set_driver_available, ctx.key(), DEMO_REGION)
            ctx.object_send(poll_for_work, ctx.key(), arg=None)
            return

        assigned_delivery["order_picked_up"] = True
        ctx.set(ASSIGNED_DELIVERY, assigned_delivery)
        await ctx.object_call(driver_digital_twin.notify_delivery_pickup, ctx.key(), arg=None)

    ctx.object_send(move, ctx.key(), arg=None, send_delay=MOVE_INTERVAL)
