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

import static dev.restate.patterns.compensations.generated.Proto.*;

import dev.restate.patterns.compensations.generated.*;
import dev.restate.patterns.compensations.generated.CarRentalRestate.CarRentalRestateClient;
import dev.restate.patterns.compensations.generated.FlightsRestate.FlightsRestateClient;
import dev.restate.patterns.compensations.generated.PaymentRestate.PaymentRestateClient;
import dev.restate.sdk.Awaitable;
import dev.restate.sdk.RestateContext;
import dev.restate.sdk.common.TerminalException;
import java.util.ArrayDeque;
import java.util.Deque;
import java.util.Iterator;

/**
 * -------------------------------------- Compensations --------------------------------------
 * Restate guarantees that your invocations are run to completion no matter what happens. However,
 * in case you want your services to be able to respond with exceptions as part of the normal
 * control flow (i.e. denoting a negative outcome) you can let the callee throw a
 * `TerminalException`. If the caller has completed previous steps before receiving the
 * `TerminalException`, it will have to undo those steps in order to leave the system in a
 * consistent state. The way to undo steps is by registering compensations and running them for all
 * completed steps. With Restate, this can be naturally expressed as part of the service code.
 * Moreover, Restate runs the compensations with the same guarantees as the service code, i.e. it
 * executes them durably until they complete, which guarantees that the system will be left in a
 * consistent state.
 *
 * <p>The very same mechanism of undoing completed steps via compensations is also needed if you
 * want to gracefully cancel an invocation, i.e. because it is no longer needed or stuck, and leave
 * the system in a consistent state. The way a graceful cancellation manifests is by throwing a
 * `TerminalException` at the next Restate API call. In fact, Restate starts cancelling your
 * invocation call tree starting with the leaf invocations first and then propagating the
 * cancellation error up. Given that your service code is properly instrumented with compensations,
 * you know that an invocation which completed with a `TerminalException` has not made any changes
 * to the system and the caller only needs to undo the steps that have been completed successfully
 * before.
 */
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
  public static class TravelService extends TravelRestate.TravelRestateImplBase {
    @Override
    public void reserve(RestateContext ctx, TravelBookingRequest request) throws TerminalException {
      final FlightsRestateClient flightsService = FlightsRestate.newClient(ctx);
      final CarRentalRestateClient carRentalService = CarRentalRestate.newClient(ctx);
      final PaymentRestateClient paymentService = PaymentRestate.newClient(ctx);

      // Create a list of compensations to run in case of a failure or cancellation.
      final Deque<Runnable> compensations = new ArrayDeque<>();

      try {
        final FlightBookingId flightBookingId =
            flightsService
                .reserve(FlightBookingRequest.newBuilder().setTripId(request.getTripID()).build())
                .await();
        // Register the compensation to undo the flight reservation.
        compensations.add(() -> flightsService.cancel(flightBookingId).await());

        final CarRentalId carRentalId =
            carRentalService
                .reserve(CarRentalRequest.newBuilder().setTripId(request.getTripID()).build())
                .await();
        // Register the compensation to undo the car rental reservation.
        compensations.add(() -> carRentalService.cancel(carRentalId).await());

        final PaymentId paymentId =
            paymentService
                .process(PaymentRequest.newBuilder().setTripId(request.getTripID()).build())
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
}
