import restate
from restate import VirtualObject, ObjectContext

"""
Virtual Objects hold state and have methods to interact with the object.
An object is identified by a unique id - only one object exists per id.

Virtual Objects have their state locally accessible without requiring any database
connection or lookup. State is exclusive, and atomically committed with the
method execution.

Virtual Objects are _Stateful Serverless_ constructs.
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