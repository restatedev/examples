#
#  Copyright (c) 2023-2024 - Restate Software, Inc., Restate GmbH
#
#  This file is part of the Restate examples,
#  which is released under the MIT license.
#
#  You can find a copy of the license in file LICENSE in the root
#  directory of this repository or package, or at
#  https://github.com/restatedev/sdk-typescript/blob/main/LICENSE
import uuid
from datetime import timedelta

from restate import Service, Context
import restate

from utils import send_notification, send_reminder

greeter = Service("Greeter")


@greeter.handler()
async def greet(ctx: Context, name: str) -> str:
    greeting_id = await ctx.run("generate UUID", lambda: str(uuid.uuid4()))
    await ctx.run("send notification", lambda: send_notification(greeting_id, name))
    await ctx.sleep(timedelta(seconds=1))
    await ctx.run("send reminder", lambda: send_reminder(greeting_id))

    return f"You said hi to {name}!"

app = restate.app(services=[greeter])
