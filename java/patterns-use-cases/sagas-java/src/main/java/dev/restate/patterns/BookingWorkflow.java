/*
 * Copyright (c) 2024 - Restate Software, Inc., Restate GmbH
 *
 * This file is part of the Restate examples,
 * which is released under the MIT license.
 *
 * You can find a copy of the license in the file LICENSE
 * in the root directory of this repository or package or at
 * https://github.com/restatedev/examples/
 */

package dev.restate.patterns;

import dev.restate.patterns.activities.*;
import dev.restate.sdk.WorkflowContext;
import dev.restate.sdk.annotation.Workflow;
import dev.restate.sdk.common.TerminalException;

import java.util.ArrayList;
import java.util.List;

//
// SAGAs / Compensations
//
// An example of a trip reservation workflow, using the SAGAs pattern to
// undo previous steps in case of an error.
//
// Durable Execution's guarantee to run code to the end in the presence
// of failures, and to deterministically recover previous steps from the
// journal, makes SAGAs easy.
// Every step pushes a compensation action (an undo operation) to a stack.
// in the case of an error, those operations are run.
//
// The main requirement is that steps are implemented as journalled
// operations, like `ctx.run()` or RPC calls/messages executed
// through the Restate Context.
//

/**
 * Trip reservation workflow which has been instrumented with compensations. The workflow tries to
 * reserve the flight and the car rental before it processes the payment. If at any point one of
 * the calls fails or gets cancelled, then the trip reservation workflow will undo all
 * successfully completed steps by running the compensations.
 *
 * <p>Note: that the compensation logic is purely implemented in the user code and runs durably
 * until it completes. Moreover, an invocation failure and an invocation cancellation are handled
 * in the exact same way by the caller.
 */
@Workflow
public class BookingWorkflow {

  // The workflow parameters, like the car and flight to book, the
  // payment details (card/token, amount, ...)
  public record TravelBookingRequest( /* car, flights, payment info, ... */ ) { }

  @Workflow
  public void run(WorkflowContext context, TravelBookingRequest request) throws TerminalException {
    // Create a list of compensations to run in case of a failure or cancellation.
    final List<Runnable> compensations = new ArrayList<>();

    try {
      // Reserve the flights and let Restate remember the reservation ID
      final var flightsRpcClient = FlightsClient.fromContext(context);
      final String flightReservationId =
          flightsRpcClient
              .reserve(new Flights.FlightBookingRequest(request))
              .await();
      // Register the compensation to undo the flight reservation.
      compensations.add(() -> flightsRpcClient.cancel(flightReservationId).await());

      // Reserve the car and let Restate remember the reservation ID
      final var carRentalRpcClient = CarRentalsClient.fromContext(context);
      final String carReservationId =
          carRentalRpcClient
              .reserve(new CarRentals.CarRentalRequest(request))
              .await();
      // Register the compensation to undo the car rental reservation.
      compensations.add(() -> carRentalRpcClient.cancel(carReservationId).await());

      // call the payment service to make the payment and let Restate remember
      // the payment ID
      final var paymentRpcClient = PaymentClient.fromContext(context);
      final String paymentId =
          paymentRpcClient
              .process(new Payment.PaymentRequest(request))
              .await();
      // Register the compensation to undo the payment.
      compensations.add(() -> paymentRpcClient.refund(paymentId).await());

      // confirm the reserved flight / rental
      // failures here will still trigger the SAGA compensations
      flightsRpcClient.confirm(flightReservationId).await();
      carRentalRpcClient.confirm(carReservationId).await();

    } catch (TerminalException e) {

      // Run the compensations
      for (Runnable compensation : compensations) {
        compensation.run();
      }

      // rethrow error to fail this workflow
      throw new TerminalException(
          e.getCode(),
          String.format(
              "Failed to reserve the trip: %s. Ran %d compensations.",
              e.getMessage(), compensations.size()));
    }
  }
}
