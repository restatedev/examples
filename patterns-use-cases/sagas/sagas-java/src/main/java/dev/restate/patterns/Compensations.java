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

import dev.restate.sdk.Awaitable;
import dev.restate.sdk.Context;
import dev.restate.sdk.ObjectContext;
import dev.restate.sdk.annotation.Handler;
import dev.restate.sdk.annotation.Service;
import dev.restate.sdk.annotation.VirtualObject;
import dev.restate.sdk.common.TerminalException;
import java.util.ArrayDeque;
import java.util.Deque;
import java.util.Iterator;

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

public class Compensations {

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
  @VirtualObject
  public static class Travels {

    public static class TravelBookingRequest { }

    @Handler
    public void reserve(ObjectContext context, TravelBookingRequest request) throws TerminalException {
      final FlightsClient.ContextClient flightsService = FlightsClient.fromContext(context);
      final CarRentalsClient.ContextClient carRentalService = CarRentalsClient.fromContext(context);
      final PaymentClient.ContextClient paymentService = PaymentClient.fromContext(context);

      // Create a list of compensations to run in case of a failure or cancellation.
      final Deque<Runnable> compensations = new ArrayDeque<>();

      try {
        final String flightBookingId =
            flightsService
                .reserve(new Flights.FlightBookingRequest())
                .await();
        // Register the compensation to undo the flight reservation.
        compensations.add(() -> flightsService.cancel(flightBookingId).await());

        final String carRentalId =
            carRentalService
                .reserve(new CarRentals.CarRentalBookingRequest())
                .await();
        // Register the compensation to undo the car rental reservation.
        compensations.add(() -> carRentalService.cancel(carRentalId).await());

        final String paymentId =
            paymentService
                .process(new Payment.PaymentRequest())
                .await();
        // Register the compensation to undo the payment.
        compensations.add(() -> paymentService.refund(paymentId).await());

        Awaitable.all(
                flightsService.confirm(flightBookingId), carRentalService.confirm(carRentalId))
            .await();
      } catch (TerminalException e) {
        // Run the compensations in reverse order
        final Iterator<Runnable> compensationsIterator = compensations.descendingIterator();

        while (compensationsIterator.hasNext()) {
          compensationsIterator.next().run();
        }

        throw new TerminalException(
            e.getCode(),
            String.format(
                "Failed to reserve the trip: %s. Ran %d compensations.",
                e.getMessage(), compensations.size()));
      }
    }
  }

  // --- Interfaces for Flights, CarRental and Payment components

  @Service(name = "Flights")
  interface Flights {
    class FlightBookingRequest { }

    @Handler String reserve(Context context, FlightBookingRequest request);
    @Handler void confirm(Context context, String flightBookingId);
    @Handler void cancel(Context context, String flightBookingId);
  }

  @Service(name = "CarRentals")
  interface CarRentals {
    class CarRentalBookingRequest { }

    @Handler String reserve(Context context, CarRentalBookingRequest request);
    @Handler void confirm(Context context, String carRentalBookingId);
    @Handler void cancel(Context context, String carRentalBookingId);
  }

  @Service(name = "Payment")
  interface Payment {
    class PaymentRequest { }

    @Handler String process(Context context, PaymentRequest request);
    @Handler void refund(Context context, String paymentId);
  }
}
