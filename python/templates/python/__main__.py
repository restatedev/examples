import hypercorn
import asyncio
import restate

from app.greeter import greeter

app = restate.app(services=[greeter])


def main():
    """Entry point for running the app."""
    conf = hypercorn.Config()
    conf.bind = ["0.0.0.0:9080"]
    asyncio.run(hypercorn.asyncio.serve(app, conf))


if __name__ == "__main__":
    main()
