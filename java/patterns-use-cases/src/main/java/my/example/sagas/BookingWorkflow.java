package my.example.sagas;

import dev.restate.sdk.Context;
import dev.restate.sdk.annotation.Handler;
import dev.restate.sdk.annotation.Service;
import dev.restate.sdk.common.TerminalException;
import dev.restate.sdk.endpoint.Endpoint;
import dev.restate.sdk.http.vertx.RestateHttpServer;
import java.util.ArrayList;
import java.util.List;
import my.example.sagas.clients.CarRentalClient;
import my.example.sagas.clients.CarRentalClient.CarRentalRequest;
import my.example.sagas.clients.FlightClient;
import my.example.sagas.clients.FlightClient.FlightBookingRequest;
import my.example.sagas.clients.PaymentClient;
import my.example.sagas.clients.PaymentClient.PaymentInfo;

/*
Trip reservation workflow using sagas:
Restate infinitely retries failures and recovers previous progress.
But for some types of failures (terminal exceptions), we don't want to retry
but want to undo the previous actions and finish.

Restate guarantees the execution of your code. This makes it very easy to implement sagas.
We execute actions and keep a list of undo actions.
When a terminal exception occurs, Restate ensures execution of all compensations.

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
| If TerminalException:                     |
|   Execute compensations in reverse order  |
| Rethrow error                             |
+-------------------------------------------+

Note: that the compensation logic is purely implemented in user code (no special Restate API)
 */

@Service
public class BookingWorkflow {

  public record BookingRequest(
      FlightBookingRequest flights, CarRentalRequest car, PaymentInfo paymentInfo) {}

  @Handler
  public void run(Context ctx, BookingRequest req) throws TerminalException {
    // Create a list of undo actions
    List<Runnable> compensations = new ArrayList<>();

    try {
      // Reserve the flights; Restate remembers the reservation ID
      String flightBookingId =
          ctx.run("Flight reservation", String.class, () -> FlightClient.reserve(req.flights()));
      // Register the undo action for the flight reservation with the flightBookingId
      compensations.add(() -> ctx.run("Cancel flight", () -> FlightClient.cancel(flightBookingId)));

      // Do the same for the car rental
      String carBookingId =
          ctx.run("Car reservation", String.class, () -> CarRentalClient.reserve(req.car()));
      compensations.add(() -> ctx.run("Cancel car", () -> CarRentalClient.cancel(carBookingId)));

      // Do the payment; Generate a payment ID and store it in Restate
      String paymentId = ctx.random().nextUUID().toString();
      // Register the refund as a compensation, using the idempotency key
      compensations.add(() -> ctx.run("Refund", () -> PaymentClient.refund(paymentId)));
      // Do the payment using the paymentId as idempotency key
      ctx.run("Execute payment", () -> PaymentClient.charge(req.paymentInfo(), paymentId));

      // Confirm the flight and car reservations
      ctx.run("Confirm flight", () -> FlightClient.confirm(flightBookingId));
      ctx.run("Confirm car", () -> CarRentalClient.confirm(carBookingId));
    }
    // Terminal errors tell Restate not to retry but to undo previous actions and fail the workflow
    catch (TerminalException e) {
      // Restate guarantees that all compensations are executed
      for (Runnable compensation : compensations) {
        compensation.run();
      }
      throw e;
    }
  }

  public static void main(String[] args) {
    RestateHttpServer.listen(Endpoint.bind(new BookingWorkflow()));
  }
}
