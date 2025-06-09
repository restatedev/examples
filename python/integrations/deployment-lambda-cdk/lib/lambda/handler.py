import restate

greeter = restate.Service("Greeter")


@greeter.handler()
async def greet(_ctx: restate.Context, name: str):
    return f"Hello, {name or 'Restate'}, from AWS Lambda!"


app = restate.app(services=[greeter])
