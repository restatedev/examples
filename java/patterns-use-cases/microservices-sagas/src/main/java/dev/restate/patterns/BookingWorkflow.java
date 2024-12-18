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
import dev.restate.patterns.clients.PaymentClient;
import dev.restate.patterns.types.BookingRequest;
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
}
