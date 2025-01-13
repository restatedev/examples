import uuid

import restate
from pydantic import BaseModel
from restate import Workflow
from restate.exceptions import TerminalError

import activities.car_rental_service as car_rental_service
import activities.flight_service as flight_service
import activities.payment_client as payment_client
from activities.car_rental_service import CarRentalRequest
from activities.flight_service import FlightBookingRequest
from activities.payment_client import PaymentInfo


class BookingRequest(BaseModel):
    flights: FlightBookingRequest
    car: CarRentalRequest
    payment_info: PaymentInfo


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
booking_workflow = Workflow("BookingWorkflow")


@booking_workflow.main()
async def run(ctx: restate.WorkflowContext, req: BookingRequest):
    # Create a list of undo actions
    compensations = []

    try:
        # Reserve the flights; Restate remembers the reservation ID
        # This sends an HTTP request via Restate to the Restate flights service
        flight_booking_id = await ctx.service_call(flight_service.reserve, arg=req.flights)
        # Use the flightBookingId to register the undo action for the flight reservation,
        # or later confirm the reservation.
        compensations.append(lambda: ctx.service_call(flight_service.cancel, arg=flight_booking_id))

        # Reserve the car and let Restate remember the reservation ID
        car_booking_id = await ctx.service_call(car_rental_service.reserve, arg=req.car)
        # Register the undo action for the car rental.
        compensations.append(lambda: ctx.service_call(car_rental_service.cancel, arg=car_booking_id))

        # Generate an idempotency key for the payment
        payment_id = await ctx.run("payment_id", lambda: str(uuid.uuid4()))

        # Register the refund as a compensation, using the idempotency key
        async def refund():
            return await payment_client.refund(payment_id)

        compensations.append(lambda: ctx.run("refund", refund))

        # Do the payment using the idempotency key
        async def charge():
            return await payment_client.charge(req.payment_info, payment_id)

        await ctx.run("charge", charge)

        # Confirm the flight and car reservations
        await ctx.service_call(flight_service.confirm, arg=flight_booking_id)
        await ctx.service_call(car_rental_service.confirm, arg=car_booking_id)

    # Terminal errors tell Restate not to retry, but to compensate and fail the workflow
    except TerminalError as e:
        # Undo all the steps up to this point by running the compensations
        # Restate guarantees that all compensations are executed
        for compensation in reversed(compensations):
            await compensation()
        # Rethrow error to fail this workflow
        raise e


app = restate.app([booking_workflow, car_rental_service.service, flight_service.service])
