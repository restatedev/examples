import restate
import uuid

from datetime import timedelta
from pydantic import BaseModel

from .utils import send_notification, send_reminder


# You can also just use a typed dict, without Pydantic
class GreetingRequest(BaseModel):
    name: str


class Greeting(BaseModel):
    message: str


greeter = restate.Service("Greeter")


@greeter.handler()
async def greet(ctx: restate.Context, req: GreetingRequest) -> Greeting:
    # Durably execute a set of steps; resilient against failures
    greeting_id = await ctx.run("generate UUID", lambda: str(uuid.uuid4()))
    await ctx.run("notification", send_notification, args=(greeting_id, req.name))
    await ctx.sleep(timedelta(seconds=1))
    await ctx.run("reminder", send_reminder, args=(greeting_id, req.name))

    # Respond to caller
    return Greeting(message=f"You said hi to {req.name}!")
