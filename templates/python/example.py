#
#  Copyright (c) 2023-2024 - Restate Software, Inc., Restate GmbH
#
#  This file is part of the Restate examples,
#  which is released under the MIT license.
#
#  You can find a copy of the license in file LICENSE in the root
#  directory of this repository or package, or at
#  https://github.com/restatedev/sdk-typescript/blob/main/LICENSE

from restate import Service, Context
import restate

greeter = Service("greeter")

@greeter.handler()
async def greet(ctx: Context, name: str) -> str:
    return f"Hello {name}!"

app = restate.app(services=[greeter])
