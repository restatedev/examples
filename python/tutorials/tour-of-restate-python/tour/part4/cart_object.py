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

from tour.part4.checkout_service import handle
from tour.part4.ticket_object import reserve, mark_as_sold, unreserve

cart = VirtualObject("CartObject")


@cart.handler("addTicket")
async def add_ticket(ctx: ObjectContext, ticket_id: str) -> bool:
    reserved = await ctx.object_call(reserve, key=ticket_id, arg=None)

    if reserved:
        tickets = await ctx.get("tickets") or []
        tickets.append(ticket_id)
        ctx.set("tickets", tickets)

        ctx.object_send(expire_ticket, key=ctx.key(), arg=ticket_id, send_delay=timedelta(minutes=15))

    return reserved


# <start_checkout>
@cart.handler()
async def checkout(ctx: ObjectContext) -> bool:
    tickets = await ctx.get("tickets") or []

    if len(tickets) == 0:
        return False

    success = await ctx.service_call(handle, arg={'user_id': ctx.key(),
                'tickets': tickets})

    if success:
        for ticket in tickets:
            ctx.object_send(mark_as_sold, key=ticket, arg=None)

        ctx.clear("tickets")

    return success
# <end_checkout>


@cart.handler("expireTicket")
async def expire_ticket(ctx: ObjectContext, ticket_id: str):
    tickets = await ctx.get("tickets") or []

    try:
        ticket_index = tickets.index(ticket_id)
    except ValueError:
        ticket_index = -1

    if ticket_index != -1:
        tickets.pop(ticket_index)
        ctx.set("tickets", tickets)

        ctx.object_send(unreserve, key=ticket_id, arg=None)
