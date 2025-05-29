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
import my.example.sagas.clients.CarRentalClient.CarRequest;
import my.example.sagas.clients.FlightClient;
import my.example.sagas.clients.FlightClient.FlightRequest;
import my.example.sagas.clients.HotelClient;
import my.example.sagas.clients.HotelClient.HotelRequest;

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

@Service
public class BookingWorkflow {

  public record BookingRequest(
      String customerId, FlightRequest flights, CarRequest car, HotelRequest hotel) {}

  @Handler
  public void run(Context ctx, BookingRequest req) throws TerminalException {
    // Create a list of undo actions
    List<Runnable> compensations = new ArrayList<>();

    try {
      // For each action, we register a compensation that will be executed on failures
      compensations.add(() -> ctx.run("Cancel flight", () -> FlightClient.cancel(req.customerId)));
      ctx.run("Flight reservation", () -> FlightClient.book(req.customerId, req.flights()));

      compensations.add(() -> ctx.run("Cancel car", () -> CarRentalClient.cancel(req.customerId)));
      ctx.run("Car reservation", () -> CarRentalClient.book(req.customerId, req.car()));

      compensations.add(() -> ctx.run("Cancel hotel", () -> HotelClient.cancel(req.customerId)));
      ctx.run("Hotel reservation", () -> HotelClient.book(req.customerId, req.hotel()));
    }
    // Terminal errors are not retried by Restate, so undo previous actions and fail the workflow
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
