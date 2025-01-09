package my.example.sagas;

import dev.restate.sdk.http.vertx.RestateHttpEndpointBuilder;
import my.example.sagas.activities.*;
import dev.restate.sdk.WorkflowContext;
import dev.restate.sdk.annotation.Workflow;
import dev.restate.sdk.common.TerminalException;

import java.util.ArrayList;
import java.util.List;

// Trip reservation workflow using sagas:
// For some types of failures, we do not want to retry but instead undo the previous actions and finish.
//
// You can use Durable Execution to execute actions and track their undo equivalents (compensations) in a list.
// When a terminal error occurs, Durable Execution ensures execution of all compensations.
//
// Note: that the compensation logic is purely implemented in user code (no special Restate API)
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

/*
NOTE: Depending on the characteristics of the API/system you interact with, you add the compensation at a different time:
1. **Two-phase commit**: For APIs like flights and cars, you first create a reservation and get an ID.
You then confirm or cancel using this ID. Add the compensation after creating the reservation.

2. **Idempotency key**: For APIs like payments, you generate a UUID and perform the action in one step.
Add the compensation before performing the action, using the same UUID.
 */

  public static void main(String[] args) {
    RestateHttpEndpointBuilder.builder()
            .bind(new BookingWorkflow())
            .bind(new CarRentals())
            .bind(new Flights())
            .buildAndListen();
  }
}
