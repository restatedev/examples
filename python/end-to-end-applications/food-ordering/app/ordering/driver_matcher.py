from restate import VirtualObject, ObjectContext

from ordering.types.types import PendingDelivery

driver_matcher = VirtualObject("driver-delivery-matcher")

PENDING_DELIVERIES = "PENDING_DELIVERIES"
AVAILABLE_DRIVERS = "AVAILABLE_DRIVERS"


@driver_matcher.handler()
async def set_driver_available(ctx: ObjectContext, driver_id: str):
    pending_deliveries: list[PendingDelivery] = await ctx.get(PENDING_DELIVERIES) or []
    if len(pending_deliveries) > 0:
        next_delivery = pending_deliveries.pop(0)
        ctx.set(PENDING_DELIVERIES, pending_deliveries)

        # Notify that delivery is ongoing
        ctx.resolve_awakeable(next_delivery["promise_id"], driver_id)
        return

    # otherwise remember driver as available
    available_drivers: list[str] = await ctx.get(AVAILABLE_DRIVERS) or []
    available_drivers.append(driver_id)
    ctx.set(AVAILABLE_DRIVERS, available_drivers)


@driver_matcher.handler()
async def request_driver_for_delivery(ctx: ObjectContext, request: PendingDelivery):
    # if a driver is available, assign the delivery right away
    available_drivers: list[str] = await ctx.get(AVAILABLE_DRIVERS) or []
    if len(available_drivers) > 0:
        # Remove driver from the pool
        next_available_driver = available_drivers.pop(0)
        ctx.set(AVAILABLE_DRIVERS, available_drivers)

        # Notify that delivery is ongoing
        ctx.resolve_awakeable(request["promise_id"], next_available_driver)
        return

    # otherwise store the delivery request until a new driver becomes available
    pending_deliveries: list[PendingDelivery] = await ctx.get(PENDING_DELIVERIES) or []
    pending_deliveries.append(request)
    ctx.set(PENDING_DELIVERIES, pending_deliveries)
