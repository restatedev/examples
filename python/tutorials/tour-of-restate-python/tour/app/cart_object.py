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

# <start_user_session>
cart = VirtualObject("CartObject")


@cart.handler("addTicket")
async def add_ticket(ctx: ObjectContext, ticket_id: str) -> bool:
    return True


@cart.handler()
async def checkout(ctx: ObjectContext) -> bool:
    return True


@cart.handler("expireTicket")
async def expire_ticket(ctx: ObjectContext, ticket_id: str):
    return
# <end_user_session>
