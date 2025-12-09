import restate
from restate import VirtualObject, ObjectContext

"""
Virtual Objects are services that hold K/V state. Its handlers interact with the object state.
An object is identified by a unique id - only one object exists per id.

To guarantee state consistency, only one handler is executed at a time per Virtual Object (ID).

Handlers are stateless executors.
Restate proxies requests to it and attaches the object's state to the request.
Virtual Objects then have their K/V state locally accessible without requiring any database
connection or lookup. State is exclusive, and atomically committed with the
method execution. It is always consistent with the progress of the execution.

Virtual Objects are Stateful (Serverless) constructs.

"""
greeter_object = VirtualObject("greeter")


@greeter_object.handler()
async def greet(ctx: ObjectContext, greeting: str) -> str:
    # Access the state attached to this object (this 'name')
    # State access and updates are exclusive and consistent with the invocations
    count = await ctx.get("count") or 0
    count += 1
    ctx.set("count", count)
    return f"{greeting} {ctx.key()} for the {count}-th time."


@greeter_object.handler()
async def ungreet(ctx: ObjectContext) -> str:
    count = await ctx.get("count") or 0
    count -= 1
    ctx.set("count", count)
    return f"Goodbye {ctx.key()}, taking one greeting back: {count}."


# Define 'app' used by hypercorn (or other HTTP servers) to serve the SDK
app = restate.app(services=[greeter_object])

"""
You can call this now through http directly the following way

example1:
curl localhost:8080/greeter/mary/greet -H 'content-type: application/json' -d '"Hi"'
example2:
curl localhost:8080/greeter/barack/greet -H 'content-type: application/json' -d '"Hello"'
example3:
curl localhost:8080/greeter/mary/ungreet -H 'content-type: application/json' -d '{}'
"""
