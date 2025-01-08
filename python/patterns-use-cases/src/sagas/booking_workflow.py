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

"""
 Trip reservation workflow using sagas:
 For some types of failures, we do not want to retry but instead undo the previous actions and finish.

 You can use Durable Execution to execute actions and track their undo equivalents (compensations) in a list.
 When a terminal error occurs, Durable Execution ensures execution of all compensations.

 Note: that the compensation logic is purely implemented in user code (no special Restate API)
"""
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

        # Confirm the flight and car reservations
        await ctx.service_call(flight_confirm, arg=flight_booking_id)
        await ctx.service_call(car_rentals.confirm, arg=car_booking_id)

    except TerminalError as e:
        # Undo all the steps up to this point by running the compensations
        for compensation in reversed(compensations):
            await compensation()
        # Rethrow error to fail this workflow
        raise e


app = restate.app([booking_workflow, car_rental_service, flights_service])

"""
NOTE: Depending on the characteristics of the API/system you interact with, you add the compensation at a different time:
1. **Two-phase commit**: For APIs like flights and cars, you first create a reservation and get an ID.
You then confirm or cancel using this ID. Add the compensation after creating the reservation.

2. **Idempotency key**: For APIs like payments, you generate a UUID and perform the action in one step.
Add the compensation before performing the action, using the same UUID.
"""
