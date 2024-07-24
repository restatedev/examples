from datetime import timedelta

from restate.context import ObjectContext
from restate.object import VirtualObject

from example.checkout_service import handle
from example.ticket_object import reserve, mark_as_sold, unreserve

cart = VirtualObject("cart")


@cart.handler()
async def add_ticket(ctx: ObjectContext, ticket_id: str) -> bool:
    reserved = await ctx.object_call(reserve, key=ticket_id, arg=None)

    if reserved:
        tickets = await ctx.get("tickets") or []
        tickets.append(ticket_id)
        ctx.set("tickets", tickets)

        ctx.object_send(expire_ticket, key=ctx.key(), arg=ticket_id, send_delay=timedelta(minutes=15))

    return reserved


@cart.handler()
async def checkout(ctx: ObjectContext) -> bool:
    tickets = await ctx.get("tickets") or []

    if len(tickets) == 0:
        return False

    success = await ctx.service_call(checkout_handle, arg={'user_id': ctx.key(),
                'tickets': tickets})

    if success:
        for ticket in tickets:
            ctx.object_send(mark_as_sold, key=ticket, arg=None)

        ctx.clear("tickets")

    return success


@cart.handler()
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
