import restate

from statefulactors.utils import bring_up_machine, Status, tear_down_machine

# This is a State Machine implemented with a Virtual Object
#
# - The object holds the state of the state machine and defines the methods
#   to transition between the states.
# - The object's unique id identifies the state machine. Many parallel state
#   machines exist, but only state machine (object) exists per id.
# - The "single-writer-per-key" characteristic of virtual objects ensures
#   that one state transition per state machine is in progress at a time.
#   Additional transitions are enqueued for that object, while a transition
#   for a machine is still in progress.
machine_operator = restate.VirtualObject("machine-operator")


@machine_operator.handler("setUp")
async def set_up(ctx: restate.ObjectContext):
    machine_id = ctx.key()

    # Ignore duplicate calls to 'setUp'
    status = await ctx.get("status", type_hint=str)
    if status == Status.UP:
        return f"{machine_id} is already up, so nothing to do"

    # Bringing up a machine is a slow process that frequently crashes
    await bring_up_machine(ctx, machine_id)
    ctx.set("status", Status.UP)

    return f"{machine_id} is now up"


@machine_operator.handler("tearDown")
async def tear_down(ctx: restate.ObjectContext):
    machine_id = ctx.key()

    status = await ctx.get("status", type_hint=str)
    if status != Status.UP:
        return f"{machine_id} is not up, cannot tear down"

    # Tearing down a machine is a slow process that frequently crashes
    await tear_down_machine(ctx, machine_id)
    ctx.set("status", Status.DOWN)

    return f"{machine_id} is now down"


app = restate.app([machine_operator])

if __name__ == "__main__":
    import hypercorn
    import asyncio

    conf = hypercorn.Config()
    conf.bind = ["0.0.0.0:9080"]
    asyncio.run(hypercorn.asyncio.serve(app, conf))
