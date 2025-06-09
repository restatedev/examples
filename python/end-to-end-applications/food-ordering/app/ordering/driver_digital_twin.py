# Copyright (c) 2024 - Restate Software, Inc., Restate GmbH
#
# This file is part of the Restate examples,
# which is released under the MIT license.
#
# You can find a copy of the license in the file LICENSE
# in the root directory of this repository or package or at
# https://github.com/restatedev/examples/

from restate import VirtualObject, ObjectContext
from restate.exceptions import TerminalError
from ordering.types.types import Location, DriverStatus, DeliveryRequest
import ordering.driver_matcher as driver_matcher
import ordering.delivery_manager as delivery_manager

driver_digital_twin = VirtualObject("driver-digital-twin")

DRIVER_STATUS = "driver-status"
ASSIGNED_DELIVERY = "assigned-delivery"
DRIVER_LOCATION = "driver-location"
DriverDeliveryMatcherObject = "driver-delivery-matcher"
DeliveryManagerObject = "delivery-manager"


@driver_digital_twin.handler()
async def set_driver_available(ctx: ObjectContext, region: str):
    await check_if_driver_in_expected_state(DriverStatus.IDLE, ctx)
    ctx.set(DRIVER_STATUS, DriverStatus.WAITING_FOR_WORK)
    ctx.object_send(driver_matcher.set_driver_available, region, ctx.key())


@driver_digital_twin.handler()
async def get_assigned_delivery(ctx: ObjectContext):
    return await ctx.get(ASSIGNED_DELIVERY)


@driver_digital_twin.handler()
async def assign_delivery_job(ctx: ObjectContext, delivery_request: DeliveryRequest):
    await check_if_driver_in_expected_state(DriverStatus.WAITING_FOR_WORK, ctx)
    ctx.set(DRIVER_STATUS, DriverStatus.DELIVERING)
    ctx.set(ASSIGNED_DELIVERY, delivery_request)
    current_location = await ctx.get(DRIVER_LOCATION)
    if current_location:
        ctx.object_send(
            delivery_manager.handle_driver_location_update,
            delivery_request["delivery_id"],
            current_location,
        )


@driver_digital_twin.handler()
async def notify_delivery_pickup(ctx: ObjectContext):
    await check_if_driver_in_expected_state(DriverStatus.DELIVERING, ctx)
    assigned_delivery = await ctx.get(ASSIGNED_DELIVERY)
    ctx.object_send(
        delivery_manager.notify_delivery_pickup,
        assigned_delivery["delivery_id"],
        arg=None,
    )


@driver_digital_twin.handler()
async def notify_delivery_delivered(ctx: ObjectContext):
    await check_if_driver_in_expected_state(DriverStatus.DELIVERING, ctx)
    assigned_delivery = await ctx.get(ASSIGNED_DELIVERY)
    ctx.clear(ASSIGNED_DELIVERY)
    ctx.object_send(
        delivery_manager.notify_delivery_delivered,
        assigned_delivery["delivery_id"],
        arg=None,
    )
    ctx.set(DRIVER_STATUS, DriverStatus.IDLE)


@driver_digital_twin.handler("handleDriverLocationUpdateEvent")
async def handle_driver_location_update_event(ctx: ObjectContext, location: Location):
    ctx.set(DRIVER_LOCATION, location)
    assigned_delivery = await ctx.get(ASSIGNED_DELIVERY)
    if assigned_delivery:
        ctx.object_send(
            delivery_manager.handle_driver_location_update,
            assigned_delivery["delivery_id"],
            location,
        )


async def check_if_driver_in_expected_state(expected_status: DriverStatus, ctx: ObjectContext):
    current_status = await ctx.get(DRIVER_STATUS) or DriverStatus.IDLE
    if current_status != expected_status:
        raise TerminalError(f"Driver status wrong. Expected {expected_status} but was {current_status}")
