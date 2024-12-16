import * as restate from "@restatedev/restate-sdk";
import {flights, FlightsService} from "./services/flights";
import {cars, CarService} from "./services/cars";
import { payments } from "./services/payments";

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
 // The main requirement is that steps are implemented as journald
 // operations, like `ctx.run()` or rpc/messaging.
const bookingWorkflow = restate.workflow({
  name: "BookingWorkflow",
  handlers: {
    run: async (ctx: restate.WorkflowContext) => {
      const tripId = ctx.key;
      // create a list of undo actions
      const compensations = [];
      try {

        // call the flight API to reserve, keeping track of how to cancel
        const flightClient = ctx.serviceClient<FlightsService>({name: "flights"});
        const flightBooking = await flightClient.reserve(tripId);
        compensations.push(() => flightClient.cancel({tripId, flightBooking}));

        // call the car rental service API to reserve, keeping track of how to cancel
        const carClient = ctx.serviceClient<CarService>({name: "cars"});
        const carBooking = await carClient.reserve(tripId);
        compensations.push(() => carClient.cancel({tripId, carBooking}));

        // call the payments API, keeping track of how to refund
        const paymentId = ctx.rand.uuidv4();
        compensations.push(() => ctx.run(() => payments.refund({ paymentId })));
        await ctx.run(() => payments.process({ tripId }));

        // confirm the flight and car reservations
        await flightClient.confirm({tripId, flightBooking});
        await carClient.confirm({tripId, carBooking});

      } catch (e) {
        if (e instanceof restate.TerminalError) {
          // undo all the steps up to this point by running the compensations
          for (const compensation of compensations.reverse()) {
            await compensation();
          }
        }
        throw e;
      }
    }
  },
});

restate.endpoint()
    .bind(bookingWorkflow)
    .bind(cars)
    .bind(flights)
    .listen(9080);
