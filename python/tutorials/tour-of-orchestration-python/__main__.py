import hypercorn
import asyncio
import restate

from app.getstarted.service import subscription_service
from app.sagas.service import subscription_saga
from app.communication.service import (
    concert_ticketing_service,
    payment_service,
    email_service,
)
from app.concurrenttasks.service import parallel_subscription_service
from app.events.service import payments
from app.objects.service import user_subscriptions
from app.timers.service import payments_with_timeout

app = restate.app(
    services=[
        subscription_service,
        subscription_saga,
        concert_ticketing_service,
        parallel_subscription_service,
        payments,
        user_subscriptions,
        payments_with_timeout,
        payment_service,
        email_service,
    ]
)


def main():
    """Entry point for running the app."""
    conf = hypercorn.Config()
    conf.bind = ["0.0.0.0:9080"]
    asyncio.run(hypercorn.asyncio.serve(app, conf))


if __name__ == "__main__":
    main()
