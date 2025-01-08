package my.example.sagas

import dev.restate.sdk.annotation.Workflow
import dev.restate.sdk.common.TerminalException
import dev.restate.sdk.http.vertx.RestateHttpEndpointBuilder
import dev.restate.sdk.kotlin.*
import dev.restate.sdk.kotlin.WorkflowContext
import kotlinx.serialization.Serializable
import my.example.sagas.activities.*

@Serializable data class TravelBookingRequest(val flights: FlightBookingRequest,
                                              val car: CarRentalBookingRequest,
                                              val paymentInfo: PaymentInfo)


// Trip reservation workflow using sagas:
// For some types of failures, we do not want to retry but instead undo the previous actions and finish.
//
// You can use Durable Execution to execute actions and track their undo equivalents (compensations) in a list.
// When a terminal error occurs, Durable Execution ensures execution of all compensations.
//
// Note: that the compensation logic is purely implemented in user code (no special Restate API)
@Workflow
class BookingWorkflow {

    @Workflow
    suspend fun run(ctx: WorkflowContext, req: TravelBookingRequest) {

        // Create a list of compensations to run in case of a failure or cancellation.
        val compensations: MutableList<suspend () -> Unit> = mutableListOf()

        try {
            // Reserve the flights and let Restate remember the reservation ID
            val flightsService = FlightsClient.fromContext(ctx)
            val flightBookingId = flightsService.reserve(req.flights).await()
            // Register the compensation to undo the flight reservation.
            compensations.add { flightsService.cancel(flightBookingId).await() }

            // Reserve the car and let Restate remember the reservation ID
            val carService = CarRentalsClient.fromContext(ctx)
            val carBookingId = carService.reserve(req.car).await()
            // Register the compensation to undo the car rental reservation.
            compensations.add { carService.cancel(carBookingId).await() }

            // Charge the payment; Generate a payment ID and store it in Restate
            val paymentId = ctx.random().nextUUID().toString()
            // Register the payment refund using the paymentId
            compensations.add { ctx.runBlock { refundCustomer(paymentId)} }
            // Do the payment using the paymentId as idempotency key
            ctx.runBlock { chargeCustomer(req.paymentInfo, paymentId)}

            // Confirm flight and car rental after payment done
            flightsService.confirm(flightBookingId).await()
            carService.confirm(carBookingId).await()
        } catch (e: TerminalException) {
            // Run the compensations in reverse order
            compensations.reversed().forEach {
                it()
            }

            throw TerminalException("Failed to reserve the trip: ${e.message}. Ran ${compensations.size} compensations.")
        }
    }
}

/*
NOTE: Depending on the characteristics of the API/system you interact with, you add the compensation at a different time:
1. **Two-phase commit**: For APIs like flights and cars, you first create a reservation and get an ID.
You then confirm or cancel using this ID. Add the compensation after creating the reservation.

2. **Idempotency key**: For APIs like payments, you generate a UUID and perform the action in one step.
Add the compensation before performing the action, using the same UUID.
 */

fun main() {
    RestateHttpEndpointBuilder
        .builder()
        .bind(BookingWorkflow())
        .bind(Flights())
        .bind(CarRentals())
        .buildAndListen()
}
