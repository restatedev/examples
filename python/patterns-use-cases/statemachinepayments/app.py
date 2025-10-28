import restate
from statemachinepayments.accounts import account
from statemachinepayments.payment_processor import payment_processor

app = restate.app([payment_processor, account])

if __name__ == "__main__":
    import hypercorn
    import asyncio

    conf = hypercorn.Config()
    conf.bind = ["0.0.0.0:9080"]
    asyncio.run(hypercorn.asyncio.serve(app, conf))
