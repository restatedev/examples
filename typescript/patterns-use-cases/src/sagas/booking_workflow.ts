import * as restate from "@restatedev/restate-sdk";
import {flights, FlightsService} from "./activities/flights";
import {cars, CarService} from "./activities/cars";
import { paymentClient } from "./activities/payment_client";

type BookingRequest = {
  flights: { flightId: string, passengerName: string },
  car: { pickupLocation: string, rentalDate: string },
  paymentInfo: { cardNumber: string, amount: number }
};

/*
Trip reservation workflow using sagas:
Restate infinitely retries failures, and recovers previous progress.
For some types of failures, we do not want to retry but instead undo the previous actions and finish.

Restate guarantees the execution of your code. This makes it very easy to implement sagas.
We execute actions, and keep track of a list of undo actions.
When a terminal error occurs (an error we do not want to retry), Restate ensures execution of all compensations.

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
+------------------ Catch ------------------+
| If TerminalError:                         |
|   Execute compensations in reverse order  |
| Rethrow error                             |
+--------------------------------------------+

Note: that the compensation logic is purely implemented in user code (no special Restate API)
 */

const bookingWorkflow = restate.workflow({
  name: "BookingWorkflow",
  handlers: {
    run: async (ctx: restate.WorkflowContext, req: BookingRequest) => {
      const {flights, car, paymentInfo} = req;

      // create a list of undo actions
      const compensations = [];

      try {
        // Reserve the flights and let Restate remember the reservation ID
        // This sends an HTTP request to the Restate flights service
        const flightClient = ctx.serviceClient<FlightsService>({name: "flights"});
        const flightBookingId = await flightClient.reserve(flights);
        // Use the flightBookingId to register the undo action for the flight reservation,
        // or later confirm the reservation.
        compensations.push(() => flightClient.cancel({flightBookingId}));

        // Reserve the car and let Restate remember the reservation ID
        const carClient = ctx.serviceClient<CarService>({name: "cars"});
        const carBookingId = await carClient.reserve(car);
        // Register the undo action for the car rental.
        compensations.push(() => carClient.cancel({carBookingId}));

        // Generate an idempotency key for the payment; stable on retries
        const paymentId = ctx.rand.uuidv4();
        // Register the refund as a compensation, using the idempotency key
        compensations.push(() => ctx.run(() => paymentClient.refund({ paymentId })));
        // Do the payment using the idempotency key
        await ctx.run(() => paymentClient.charge({ paymentInfo, paymentId }));

        // Confirm the flight and car reservations
        await flightClient.confirm({flightBookingId});
        await carClient.confirm({carBookingId});

      } catch (e) {
        if (e instanceof restate.TerminalError) {
          // Undo all the steps up to this point by running the compensations
          // Restate guarantees that all compensations are executed
          for (const compensation of compensations.reverse()) {
            await compensation();
          }
        }
        // Rethrow error to fail this workflow
        throw e;
      }
    }
  },
});

/*
The example shows two styles of APIs we interact with:
1. The flights and cars require to first reserve, and then use the ID you get to confirm or cancel.
In this case, we add the compensation after creating the reservation (because we need the ID).

2. The example of the payment API requires you to generate an idempotency key yourself, and executes in one shot.
Here, we add the compensation before performing the action, using the same UUID.
 */

restate.endpoint()
    .bind(bookingWorkflow)
    .bind(cars)
    .bind(flights)
    .listen(9080);
