import uuid
import restate
from datetime import timedelta
from restate import Service, Context
from utils import send_notification, send_reminder
from pydantic import BaseModel


# You can also just use a typed dict, without Pydantic
class GreetingRequest(BaseModel):
    name: str


class Greeting(BaseModel):
    message: str


greeter = Service("Greeter")


@greeter.handler()
async def greet(ctx: Context, req: GreetingRequest) -> Greeting:
    # Durably execute a set of steps; resilient against failures
    greeting_id = await ctx.run("generate UUID", lambda: str(uuid.uuid4()))
    await ctx.run("send notification", lambda: send_notification(greeting_id, req.name))
    await ctx.sleep(timedelta(seconds=1))
    await ctx.run("send reminder", lambda: send_reminder(greeting_id))

    # Respond to caller
    return Greeting(message=f"You said hi to {req.name}!")


app = restate.app(services=[greeter])
