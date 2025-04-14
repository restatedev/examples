# Copyright (c) 2024 - Restate Software, Inc., Restate GmbH
#
# This file is part of the Restate examples,
# which is released under the MIT license.
#
# You can find a copy of the license in the file LICENSE
# in the root directory of this repository or package or at
# https://github.com/restatedev/examples/

from restate import VirtualObject, ObjectContext
import order_workflow as order_workflow

order_status = VirtualObject("order-status")


@order_status.handler()
async def get(ctx: ObjectContext):
    eta = await ctx.get("eta") or None
    status = (
        await ctx.workflow_call(order_workflow.get_status, ctx.key(), arg=None) or None
    )
    return {"eta": eta, "status": status}


@order_status.handler()
async def set_eta(ctx: ObjectContext, eta: int):
    ctx.set("eta", eta)


@order_status.handler()
async def event_handler(ctx: ObjectContext, eta: int):
    ctx.set("eta", eta)
