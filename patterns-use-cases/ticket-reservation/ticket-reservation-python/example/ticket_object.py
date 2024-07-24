from restate.context import ObjectContext
from restate.object import VirtualObject


ticket = VirtualObject("ticket")


@ticket.handler()
async def reserve(ctx: ObjectContext) -> bool:
    status = await ctx.get("status") or "AVAILABLE"

    if status == "AVAILABLE":
        ctx.set("status", "RESERVED")
        return True
    else:
        return False


@ticket.handler()
async def unreserve(ctx: ObjectContext):
    status = await ctx.get("status") or "AVAILABLE"

    if status != "SOLD":
        ctx.clear("status")


@ticket.handler()
async def mark_as_sold(ctx: ObjectContext):
    status = await ctx.get("status") or "AVAILABLE"

    if status == "RESERVED":
        ctx.set("status", "SOLD")
