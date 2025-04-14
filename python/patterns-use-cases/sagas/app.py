import uuid

import restate
from pydantic import BaseModel
from restate.exceptions import TerminalError

import activities.flight_client as flight_client
import activities.car_rental_client as car_rental_client
import activities.payment_client as payment_client


class BookingRequest(BaseModel):
    flights: flight_client.FlightBookingRequest
    car: car_rental_client.CarRentalRequest
    payment_info: payment_client.PaymentInfo


"""
Trip reservation workflow using sagas:
Restate infinitely retries failures, and recovers previous progress.
But for some types of failures (terminal errors), we don't want to retry but want to undo the previous actions and finish.

Restate guarantees the execution of your code. This makes it very easy to implement sagas.
We execute actions, and keep track of a list of undo actions.
When a terminal errors occurs, Restate ensures execution of all compensations.

+------ Initialize compensations list ------+
                     |
                     v
+------------------ Try --------------------+
| 1. Reserve Flights & Register Undo        |
| 2. Reserve Car & Register Undo            |
| 3. Generate Payment ID & Register Refund  |
| 4. Perform Payment                        |
| 5. Confirm Flight Reservation             |
| 6. Confirm Car Reservation                |
+------------------ Except ------------------+
| If TerminalError:                         |
|   Execute compensations in reverse order  |
| Rethrow error                             |
+--------------------------------------------+

Note: that the compensation logic is purely implemented in user code (no special Restate API)
"""
booking_workflow = restate.Workflow("BookingWorkflow")


@booking_workflow.main()
async def run(ctx: restate.WorkflowContext, req: BookingRequest):
    # Create a list of undo actions
    compensations = []

    try:
        # Reserve the flights; Restate remembers the reservation ID
        # This sends an HTTP request via Restate to the Restate flights service
        flight_booking_id = await ctx.run("Reserve flights", flight_client.reserve, args=(req.flights,))
        # Use the flightBookingId to register the undo action for the flight reservation,
        # or later confirm the reservation.
        compensations.append(lambda: ctx.run("Cancel flights", flight_client.cancel, args=(flight_booking_id,)))

        # Reserve the car and let Restate remember the reservation ID
        car_booking_id = await ctx.run("Reserve car", car_rental_client.reserve, args=(req.car,))
        # Register the undo action for the car rental.
        compensations.append(lambda: ctx.run("Cancel car", car_rental_client.cancel, args=(car_booking_id,)))

        # Generate an idempotency key for the payment
        payment_id = await ctx.run("payment_id", lambda: str(uuid.uuid4()))

        # Register the refund as a compensation, using the idempotency key
        compensations.append(lambda: ctx.run("refund", payment_client.refund, args=(payment_id,)))

        # Do the payment using the idempotency key
        await ctx.run("charge", payment_client.charge, args=(req.payment_info, payment_id,))

        # Confirm the flight and car reservations
        await ctx.run("Confirm flight", flight_client.confirm, args=(flight_booking_id,))
        await ctx.run("Confirm car", car_rental_client.confirm, args=(car_booking_id,))

    # Terminal errors tell Restate not to retry, but to compensate and fail the workflow
    except TerminalError as e:
        # Undo all the steps up to this point by running the compensations
        # Restate guarantees that all compensations are executed
        for compensation in reversed(compensations):
            await compensation()
        # Rethrow error to fail this workflow
        raise e


app = restate.app([booking_workflow])

if __name__ == "__main__":
    import hypercorn
    import asyncio
    conf = hypercorn.Config()
    conf.bind = ["0.0.0.0:9080"]
    asyncio.run(hypercorn.asyncio.serve(app, conf))