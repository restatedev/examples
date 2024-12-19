import uuid

import restate
from pydantic import BaseModel
from restate import Workflow
from restate.exceptions import TerminalError

from src.sagas.activities.flights import flights_service, reserve as flight_reserve, confirm as flight_confirm, \
    cancel as flight_cancel, FlightBookingRequest
from src.sagas.activities.car_rentals import CarRentalRequest, car_rental_service
import src.sagas.activities.car_rentals as car_rentals

from src.sagas.activities.payment_client import PaymentInfo
import src.sagas.activities.payment_client as payment_client


class BookingRequest(BaseModel):
    flights: FlightBookingRequest
    car: CarRentalRequest
    payment_info: PaymentInfo


# An example of a trip reservation workflow, using the SAGAs pattern to
# undo previous steps in case of an error.
#
# The durable execution's guarantee to run code to the end in the presence
# of failures, and to deterministically recover previous steps from the
# journal, makes sagas easy.
# Every step pushes a compensation action (an undo operation) to a stack.
# in the case of an error, those operations are run.
#
# The main requirement is that steps are implemented as journaled
# operations, like `ctx.run()` or rpc/messaging.
#
# Note: that the compensation logic is purely implemented in the user code and runs durably
# until it completes.
booking_workflow = Workflow("BookingWorkflow")


@booking_workflow.main()
async def run(ctx: restate.WorkflowContext, req: BookingRequest):
    # create a list of undo actions
    compensations = []

    try:
        # Reserve the flights and let Restate remember the reservation ID
        flight_booking_id = await ctx.service_call(flight_reserve, arg=req.flights)
        # Register the undo action for the flight reservation.

        compensations.append(lambda: ctx.service_call(flight_cancel, arg=flight_booking_id))

        # Reserve the car and let Restate remember the reservation ID
        car_booking_id = await ctx.service_call(car_rentals.reserve, arg=req.car)
        # Register the undo action for the car rental.
        compensations.append(lambda: ctx.service_call(car_rentals.cancel, arg=car_booking_id))

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

        # confirm the flight and car reservations
        await ctx.service_call(flight_confirm, arg=flight_booking_id)
        await ctx.service_call(car_rentals.confirm, arg=car_booking_id)

    except TerminalError as e:
        # undo all the steps up to this point by running the compensations
        for compensation in reversed(compensations):
            await compensation()
        # rethrow error to fail this workflow
        raise e


app = restate.app([booking_workflow, car_rental_service, flights_service])
