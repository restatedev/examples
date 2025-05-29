import * as restate from "@restatedev/restate-sdk";
import { flightClient } from "./clients/flight_client";
import { carRentalClient } from "./clients/car_rental_client";
import { hotelClient } from "./clients/hotel_client";

type BookingRequest = {
  customerId: string;
  flights: { flightId: string; passengerName: string };
  car: { pickupLocation: string; rentalDate: string };
  hotel: { arrivalDate: string; departureDate: string };
};

/*
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
 */

const bookingWorkflow = restate.service({
  name: "BookingWorkflow",
  handlers: {
    run: async (ctx: restate.Context, req: BookingRequest) => {
      // create a list of undo actions
      const compensations = [];

      try {
        // For each action, we register a compensation that will be executed on failures
        compensations.push(() =>
          ctx.run("Cancel flight", () => flightClient.cancel(req.customerId))
        );
        await ctx.run("Book flight", () =>
          flightClient.book(req.customerId, req.flights)
        );

        compensations.push(() =>
          ctx.run("Cancel car", () => carRentalClient.cancel(req.customerId))
        );
        await ctx.run("Book car", () =>
          carRentalClient.book(req.customerId, req.car)
        );

        compensations.push(() =>
          ctx.run("Cancel hotel", () => hotelClient.cancel(req.customerId))
        );
        await ctx.run("Book hotel", () =>
          hotelClient.book(req.customerId, req.hotel)
        );
      } catch (e) {
        // Terminal errors are not retried by Restate, so undo previous actions and fail the workflow
        if (e instanceof restate.TerminalError) {
          // Restate guarantees that all compensations are executed
          for (const compensation of compensations.reverse()) {
            await compensation();
          }
        }
        throw e;
      }
    },
  },
});

restate.endpoint().bind(bookingWorkflow).listen(9080);
