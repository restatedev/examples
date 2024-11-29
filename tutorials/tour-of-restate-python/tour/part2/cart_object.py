# Copyright (c) 2024 - Restate Software, Inc., Restate GmbH
#
# This file is part of the Restate examples,
# which is released under the MIT license.
#
# You can find a copy of the license in the file LICENSE
# in the root directory of this repository or package or at
# https://github.com/restatedev/examples/

from datetime import timedelta

from restate.context import ObjectContext
from restate.object import VirtualObject

from tour.part2.checkout_service import handle
from tour.part2.ticket_object import reserve, unreserve

cart = VirtualObject("CartObject")


# <start_add_ticket>
@cart.handler("addTicket")
async def add_ticket(ctx: ObjectContext, ticket_id: str) -> bool:
    reserved = await ctx.object_call(reserve, key=ticket_id, arg=None)

    if reserved:
        # !mark
        ctx.object_send(expire_ticket, key=ctx.key(), arg=ticket_id, send_delay=timedelta(minutes=15))

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
    ctx.object_send(unreserve, key=ticket_id, arg=None)
# <end_expire_ticket>
