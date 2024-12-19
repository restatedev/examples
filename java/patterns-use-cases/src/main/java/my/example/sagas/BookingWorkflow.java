package my.example.sagas;

import dev.restate.sdk.http.vertx.RestateHttpEndpointBuilder;
import my.example.sagas.activities.*;
import dev.restate.sdk.WorkflowContext;
import dev.restate.sdk.annotation.Workflow;
import dev.restate.sdk.common.TerminalException;

import java.util.ArrayList;
import java.util.List;

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
// Note: that the compensation logic is purely implemented in the user code
// and runs durably until it completes.
@Workflow
public class BookingWorkflow {

  public record BookingRequest(
          Flights.FlightBookingRequest flights,
          CarRentals.CarRentalRequest car,
          PaymentClient.PaymentInfo paymentInfo
  ) {}

  @Workflow
  public void run(WorkflowContext ctx, BookingRequest req) throws TerminalException {
    // create a list of undo actions
    List<Runnable> compensations = new ArrayList<>();

    try {
      // Reserve the flights; Restate remembers the reservation ID
      var flightsRpcClient = FlightsClient.fromContext(ctx);
      String flightBookingId = flightsRpcClient.reserve(req.flights()).await();
      // Register the undo action for the flight reservation.
      compensations.add(() -> flightsRpcClient.cancel(flightBookingId).await());

      // Reserve the car; Restate remembers the reservation ID
      var carRentalRpcClient = CarRentalsClient.fromContext(ctx);
      String carBookingId = carRentalRpcClient.reserve(req.car()).await();
      // Register the undo action for the car rental.
      compensations.add(() -> carRentalRpcClient.cancel(carBookingId).await());

      // Charge the payment; Generate a payment ID and store it in Restate
      String paymentId = ctx.random().nextUUID().toString();
      // Register the payment refund using the paymentId
      compensations.add(() -> ctx.run(() -> PaymentClient.refund(paymentId)));
      // Do the payment using the paymentId as idempotency key
      ctx.run(() -> PaymentClient.charge(req.paymentInfo(), paymentId));

      // confirm the flight and car reservations
      flightsRpcClient.confirm(flightBookingId).await();
      carRentalRpcClient.confirm(carBookingId).await();

    } catch (TerminalException e) {
      // undo all the steps up to this point by running the compensations
      for (Runnable compensation : compensations) {
        compensation.run();
      }

      // rethrow error to fail this workflow
      throw e;
    }
  }

  public static void main(String[] args) {
    RestateHttpEndpointBuilder.builder()
            .bind(new BookingWorkflow())
            .bind(new CarRentals())
            .bind(new Flights())
            .buildAndListen();
  }
}
