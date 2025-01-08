import * as restate from "@restatedev/restate-sdk";
import {flights, FlightsService} from "./activities/flights";
import {cars, CarService} from "./activities/cars";
import { paymentClient } from "./activities/payment_client";

type BookingRequest = {
  flights: { flightId: string, passengerName: string },
  car: { pickupLocation: string, rentalDate: string },
  paymentInfo: { cardNumber: string, amount: number }
};

// Trip reservation workflow using sagas:
// For some types of failures, we do not want to retry but instead undo the previous actions and finish.
//
// You can use Durable Execution to execute actions and track their undo equivalents (compensations) in a list.
// When a terminal error occurs, Durable Execution ensures execution of all compensations.
//
// Note: that the compensation logic is purely implemented in user code (no special Restate API)

const bookingWorkflow = restate.workflow({
  name: "BookingWorkflow",
  handlers: {
    run: async (ctx: restate.WorkflowContext, req: BookingRequest) => {
      const {flights, car, paymentInfo} = req;

      // create a list of undo actions
      const compensations = [];

      try {
        // Reserve the flights and let Restate remember the reservation ID
        const flightClient = ctx.serviceClient<FlightsService>({name: "flights"});
        const flightBookingId = await flightClient.reserve(flights);
        // Register the undo action for the flight reservation.
        compensations.push(() => flightClient.cancel({flightBookingId}));

        // Reserve the car and let Restate remember the reservation ID
        const carClient = ctx.serviceClient<CarService>({name: "cars"});
        const carBookingId = await carClient.reserve(car);
        // Register the undo action for the car rental.
        compensations.push(() => carClient.cancel({carBookingId}));

        // Generate an idempotency key for the payment
        const paymentId = ctx.rand.uuidv4();
        // Register the refund as a compensation, using the idempotency key
        compensations.push(() => ctx.run(() => paymentClient.refund({ paymentId })));
        // Do the payment using the idempotency key
        await ctx.run(() => paymentClient.charge({ paymentInfo, paymentId }));

        // confirm the flight and car reservations
        await flightClient.confirm({flightBookingId});
        await carClient.confirm({carBookingId});

      } catch (e) {
        if (e instanceof restate.TerminalError) {
          // undo all the steps up to this point by running the compensations
          for (const compensation of compensations.reverse()) {
            await compensation();
          }
        }
        // rethrow error to fail this workflow
        throw e;
      }
    }
  },
});

/*
NOTE: Depending on the characteristics of the API/system you interact with, you add the compensation at a different time:
1. **Two-phase commit**: For APIs like flights and cars, you first create a reservation and get an ID.
You then confirm or cancel using this ID. Add the compensation after creating the reservation.

2. **Idempotency key**: For APIs like payments, you generate a UUID and perform the action in one step.
Add the compensation before performing the action, using the same UUID.
 */

restate.endpoint()
    .bind(bookingWorkflow)
    .bind(cars)
    .bind(flights)
    .listen(9080);
