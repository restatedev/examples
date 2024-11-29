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

from tour.part1.checkout_service import handle
from tour.part1.ticket_object import reserve, unreserve

cart = VirtualObject("CartObject")


# <start_add_ticket>
@cart.handler("addTicket")
async def add_ticket(ctx: ObjectContext, ticket_id: str) -> bool:
    # !mark
    reserved = await ctx.object_call(reserve, key=ticket_id, arg=None)

    return reserved


# <end_add_ticket>


# <start_checkout>
@cart.handler()
async def checkout(ctx: ObjectContext) -> bool:
    # !mark(1:2)
    success = await ctx.service_call(handle, arg={'user_id': ctx.key(),
                                                  'tickets': ["seat2B"]})

    return success
# <end_checkout>


# <start_expire_ticket>
@cart.handler("expireTicket")
async def expire_ticket(ctx: ObjectContext, ticket_id: str):
    # !mark
    ctx.object_send(unreserve, key=ticket_id, arg=None)
# <end_expire_ticket>
