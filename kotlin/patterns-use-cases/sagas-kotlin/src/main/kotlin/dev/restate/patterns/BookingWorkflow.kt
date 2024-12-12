package dev.restate.patterns

import dev.restate.patterns.activities.CarRentalBookingRequest
import dev.restate.patterns.activities.CarRentals
import dev.restate.patterns.activities.CarRentalsClient
import dev.restate.patterns.activities.FlightBookingRequest
import dev.restate.patterns.activities.Flights
import dev.restate.patterns.activities.FlightsClient
import dev.restate.patterns.activities.Payment
import dev.restate.patterns.activities.PaymentClient
import dev.restate.patterns.activities.PaymentRequest
import dev.restate.sdk.annotation.Workflow
import dev.restate.sdk.common.TerminalException
import dev.restate.sdk.http.vertx.RestateHttpEndpointBuilder
import dev.restate.sdk.kotlin.WorkflowContext
import kotlinx.serialization.Serializable

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

@Serializable data class TravelBookingRequest(val destination: String, val car: String, val card: String)

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
class BookingWorkflow {

    @Workflow
    suspend fun run(ctx: WorkflowContext, request: TravelBookingRequest) {

        // Create a list of compensations to run in case of a failure or cancellation.
        val compensations: MutableList<suspend () -> Unit> = mutableListOf()

        try {
            // 1. Reserve the flights and let Restate remember the reservation ID
            val flightsService = FlightsClient.fromContext(ctx)
            val flightBookingId = flightsService
                .reserve(FlightBookingRequest(request.destination))
                .await()
            // Register the compensation to undo the flight reservation.
            compensations.add { flightsService.cancel(flightBookingId).await() }

            // 2. Reserve the car and let Restate remember the reservation ID
            val carRentalsService = CarRentalsClient.fromContext(ctx)
            val carRentalBookingId = carRentalsService
                    .reserve(CarRentalBookingRequest(request.car))
                    .await()
            // Register the compensation to undo the car rental reservation.
            compensations.add { carRentalsService.cancel(carRentalBookingId).await() }

            // 3. Call the payment service to make the payment and let Restate remember
            // the payment ID
            val paymentService = PaymentClient.fromContext(ctx)
            val paymentId = paymentService
                .process(PaymentRequest(request.card))
                .await()
            // Register the compensation to undo the payment.
            compensations.add { paymentService.refund(paymentId).await() }

            // 4. Confirm flight and car rental after payment done
            flightsService.confirm(flightBookingId).await()
            carRentalsService.confirm(carRentalBookingId).await()
        } catch (e: TerminalException) {
            // Run the compensations in reverse order
            compensations.reversed().forEach {
                it()
            }

            throw TerminalException("Failed to reserve the trip: ${e.message}. Ran ${compensations.size} compensations.")
        }
    }
}

fun main() {
    RestateHttpEndpointBuilder
        .builder()
        .bind(BookingWorkflow())
        .bind(Flights())
        .bind(CarRentals())
        .bind(Payment())
        .buildAndListen()
}
