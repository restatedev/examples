package dev.restate.patterns

import dev.restate.sdk.annotation.Handler
import dev.restate.sdk.annotation.Service
import dev.restate.sdk.annotation.VirtualObject
import dev.restate.sdk.common.TerminalException
import dev.restate.sdk.kotlin.Context
import dev.restate.sdk.kotlin.ObjectContext
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
@VirtualObject
class Travels {

    @Handler
    suspend fun reserve(ctx: ObjectContext, request: TravelBookingRequest) {
        val flightsService = FlightsClient.fromContext(ctx)
        val carRentalsService = CarRentalsClient.fromContext(ctx)
        val paymentService = PaymentClient.fromContext(ctx)

        // Create a list of compensations to run in case of a failure or cancellation.
        val compensations: MutableList<suspend () -> Unit> = mutableListOf()

        try {
            val flightBookingId = flightsService
                .reserve(FlightBookingRequest(request.destination))
                .await()
            // Register the compensation to undo the flight reservation.
            compensations.add { flightsService.cancel(flightBookingId).await() }

            val carRentalBookingId = carRentalsService
                    .reserve(CarRentalBookingRequest(request.car))
                    .await()
            // Register the compensation to undo the car rental reservation.
            compensations.add { carRentalsService.cancel(carRentalBookingId).await() }

            val paymentId = paymentService
                .process(PaymentRequest(request.card))
                .await()
            // Register the compensation to undo the payment.
            compensations.add { paymentService.refund(paymentId).await() }

            // Confirm flight and car rental after payment done
            flightsService.confirm(flightBookingId).await()
            carRentalsService.confirm(carRentalBookingId).await()
        } catch (e: TerminalException) {
            // Run the compensations in reverse order
            compensations.reversed().forEach {
                it()
            }

            throw TerminalException("Failed to reserve the trip: ${e.message}")
        }
    }
}

// --- Interfaces for Flights, CarRental and Payment components

@Serializable
data class FlightBookingRequest(val destination: String)

@Service
interface Flights {
    @Handler
    fun reserve(context: Context, request: FlightBookingRequest): String

    @Handler
    fun confirm(context: Context, flightBookingId: String)

    @Handler
    fun cancel(context: Context, flightBookingId: String)
}

@Serializable
data class CarRentalBookingRequest(val car: String)

@Service
interface CarRentals {
    @Handler
    fun reserve(context: Context, request: CarRentalBookingRequest): String

    @Handler
    fun confirm(context: Context, carRentalBookingId: String)

    @Handler
    fun cancel(context: Context, carRentalBookingId: String)
}

@Serializable
data class PaymentRequest(val card: String)

@Service
interface Payment {
    @Handler
    fun process(context: Context, request: PaymentRequest): String

    @Handler
    fun refund(context: Context, paymentId: String)
}
