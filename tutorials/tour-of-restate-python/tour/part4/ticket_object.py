# Copyright (c) 2024 - Restate Software, Inc., Restate GmbH
#
# This file is part of the Restate examples,
# which is released under the MIT license.
#
# You can find a copy of the license in the file LICENSE
# in the root directory of this repository or package or at
# https://github.com/restatedev/examples/

from restate.context import ObjectContext
from restate.object import VirtualObject


ticket = VirtualObject("TicketObject")


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
