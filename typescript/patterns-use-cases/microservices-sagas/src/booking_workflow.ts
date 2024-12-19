import * as restate from "@restatedev/restate-sdk";
import {flights, FlightsService} from "./services/flights";
import {cars, CarService} from "./services/cars";
import { paymentClient } from "./utils/payment_client";

type BookingRequest = {
  flights: { flightId: string, passengerName: string },
  car: { pickupLocation: string, rentalDate: string },
  paymentInfo: { cardNumber: string, amount: number }
};

 //
 // An example of a trip reservation workflow, using the SAGAs pattern to
 // undo previous steps in case of an error.
 //
 // The durable execution's guarantee to run code to the end in the presence
 // of failures, and to deterministically recover previous steps from the
 // journal, makes sagas easy.
 // Every step pushes a compensation action (an undo operation) to a stack.
 // in the case of an error, those operations are run.
 //
 // The main requirement is that steps are implemented as journaled
 // operations, like `ctx.run()` or rpc/messaging.
//
// Note: that the compensation logic is purely implemented in the user code and runs durably
// until it completes.
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

restate.endpoint()
    .bind(bookingWorkflow)
    .bind(cars)
    .bind(flights)
    .listen(9081);
