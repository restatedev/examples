import restate

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
    greeting_id = str(ctx.uuid())
    await ctx.run_typed("notification", send_notification, greeting_id=greeting_id, name=req.name)
    await ctx.sleep(timedelta(seconds=1))
    await ctx.run_typed("reminder", send_reminder, greeting_id=greeting_id, name=req.name)

    # Respond to caller
    return Greeting(message=f"You said hi to {req.name}!")
