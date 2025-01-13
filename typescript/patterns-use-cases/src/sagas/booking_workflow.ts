import * as restate from "@restatedev/restate-sdk";
import {flightsService, FlightsService} from "./activities/flight_service";
import {carRentalService, CarRentalService} from "./activities/car_rental_service";
import {paymentClient} from "./activities/payment_client";

const FlightsService: FlightsService = { name: "FlightsService" };
const CarRentalService: CarRentalService = { name: "CarRentalService" };

type BookingRequest = {
  flights: { flightId: string, passengerName: string },
  car: { pickupLocation: string, rentalDate: string },
  paymentInfo: { cardNumber: string, amount: number }
};

/*
Trip reservation workflow using sagas:
Restate infinitely retries failures, and recovers previous progress.
But for some types of failures (TerminalError), we don't want to retry but want to undo the previous actions and finish.

Restate guarantees the execution of your code. This makes it very easy to implement sagas.
We execute actions, and keep track of a list of undo actions.
When a terminal error occurs, Restate ensures execution of all compensations.

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
        // This sends an HTTP request via Restate to the Restate flights service
        const flightBookingId = await ctx.serviceClient(FlightsService).reserve(flights);
        // Use the flightBookingId to register the undo action for the flight reservation,
        // or later confirm the reservation.
        compensations.push(() => ctx.serviceClient(FlightsService).cancel({flightBookingId}));

        // Reserve the car and let Restate remember the reservation ID
        const carBookingId = await ctx.serviceClient(CarRentalService).reserve(car);
        // Register the undo action for the car rental.
        compensations.push(() => ctx.serviceClient(CarRentalService).cancel({carBookingId}));

        // Generate an idempotency key for the payment; stable on retries
        const paymentId = ctx.rand.uuidv4();
        // Register the refund as a compensation, using the idempotency key
        compensations.push(() => ctx.run(() => paymentClient.refund({ paymentId })));
        // Do the payment using the idempotency key (sometimes throws Terminal Errors)
        await ctx.run(() => paymentClient.charge({ paymentInfo, paymentId }));

        // Confirm the flight and car reservations
        await ctx.serviceClient(FlightsService).confirm({flightBookingId});
        await ctx.serviceClient(CarRentalService).confirm({carBookingId});

      } catch (e) {
        // Terminal errors tell Restate not to retry, but to compensate and fail the workflow
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

restate.endpoint()
    .bind(bookingWorkflow)
    .bind(carRentalService)
    .bind(flightsService)
    .listen(9080);