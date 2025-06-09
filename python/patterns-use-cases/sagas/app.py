import logging

import restate
from pydantic import BaseModel
from restate.exceptions import TerminalError

import clients.flight_client as flight_client
import clients.car_rental_client as car_rental_client
import clients.hotel_client as hotel_client

logging.basicConfig(
    level=logging.INFO,
    format="[%(asctime)s] [%(process)d] [%(levelname)s] - %(message)s",
)


class BookingRequest(BaseModel):
    customer_id: str
    flight: flight_client.FlightRequest
    car: car_rental_client.CarRentalRequest
    hotel: hotel_client.HotelRequest


"""
Trip reservation workflow using sagas:
Restate infinitely retries failures and recovers previous progress.
But for some types of failures (terminal errors), we don't want to retry
but want to undo the previous actions and finish.

Restate guarantees the execution of your code. This makes it very easy to implement sagas.
We execute actions and keep a list of undo actions.
When a terminal exception occurs, Restate ensures execution of all compensations.

+------ Initialize compensations list ------+
                     |
                     v
+------------------ Try --------------------+
| 1. Reserve Flights & Register Cancel      |
| 2. Reserve Car & Register Cancel          |
| 3. Reserve Hotel & Register Cancel        |
+------------------ Catch ------------------+
| If TerminalException:                     |
|   Execute compensations in reverse order  |
| Rethrow error                             |
+-------------------------------------------+

Note: that the compensation logic is purely implemented in user code (no special Restate API)
"""
booking_workflow = restate.Service("BookingWorkflow")


@booking_workflow.handler()
async def run(ctx: restate.Context, req: BookingRequest):
    # Create a list of undo actions
    compensations = []

    try:
        # For each action, we register a compensation that will be executed on failures
        compensations.append(
            lambda: ctx.run("Cancel flight", flight_client.cancel, args=(req.customer_id,))
        )
        await ctx.run("Book flight", flight_client.book, args=(req.customer_id, req.flight))

        compensations.append(
            lambda: ctx.run("Cancel car", car_rental_client.cancel, args=(req.customer_id,))
        )
        await ctx.run("Book car", car_rental_client.book, args=(req.customer_id, req.car))

        compensations.append(
            lambda: ctx.run("Cancel hotel", hotel_client.cancel, args=(req.customer_id,))
        )
        await ctx.run("Book hotel", hotel_client.book, args=(req.customer_id, req.hotel))

    # Terminal errors are not retried by Restate, so undo previous actions and fail the workflow
    except TerminalError as e:
        # Restate guarantees that all compensations are executed
        for compensation in reversed(compensations):
            await compensation()
        raise e


app = restate.app([booking_workflow])

if __name__ == "__main__":
    import hypercorn
    import asyncio

    conf = hypercorn.Config()
    conf.bind = ["0.0.0.0:9080"]
    asyncio.run(hypercorn.asyncio.serve(app, conf))
