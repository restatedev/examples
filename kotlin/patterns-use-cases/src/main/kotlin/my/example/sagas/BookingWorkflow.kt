package my.example.sagas

import dev.restate.sdk.annotation.Handler
import dev.restate.sdk.annotation.Service
import dev.restate.sdk.common.TerminalException
import dev.restate.sdk.http.vertx.RestateHttpServer
import dev.restate.sdk.kotlin.*
import dev.restate.sdk.kotlin.endpoint.endpoint
import kotlinx.serialization.Serializable
import my.example.sagas.clients.CarRentalBookingRequest
import my.example.sagas.clients.FlightBookingRequest
import my.example.sagas.clients.HotelRequest
import my.example.sagas.clients.bookCar
import my.example.sagas.clients.bookFlight
import my.example.sagas.clients.bookHotel
import my.example.sagas.clients.cancelCar
import my.example.sagas.clients.cancelFlight
import my.example.sagas.clients.cancelHotel

@Serializable
data class BookingRequest(
    val customerId: String,
    val flights: FlightBookingRequest,
    val car: CarRentalBookingRequest,
    val hotel: HotelRequest
)

/*
Trip reservation workflow using sagas:
Restate infinitely retries failures, and recovers previous progress.
But for some types of failures, we don't want to retry but want to undo the previous actions and finish.

Restate guarantees the execution of your code. This makes it very easy to implement sagas.
We execute actions, and keep track of a list of undo actions.
When a terminal exception occurs (an exception we do not want to retry), Restate ensures execution of all compensations.

+------ Initialize compensations list ------+
                     |
                     v
+------------------ Try --------------------+
| 1. Reserve Flights & Register Undo        |
| 2. Reserve Car & Register Undo            |
| 3. Reserve Hotel & Register Cancel        |
+------------------ Catch ------------------+
| If TerminalException:                     |
|   Execute compensations in reverse order  |
| Rethrow error                             |
+-------------------------------------------+

Note: that the compensation logic is purely implemented in user code (no special Restate API)
 */
@Service
class BookingWorkflow {

  @Handler
  suspend fun run(ctx: Context, req: BookingRequest) {

    // Create a list of compensations to run in case of a failure or cancellation.
    val compensations = mutableListOf<suspend () -> Unit>()

    try {
      compensations.add { ctx.runBlock("Cancel flight") { cancelFlight(req.customerId) } }
      ctx.runBlock("Flight reservation") { bookFlight(req.customerId, req.flights) }

      compensations.add { ctx.runBlock("Cancel car") { cancelCar(req.customerId) } }
      ctx.runBlock("Car reservation") { bookCar(req.customerId, req.car) }

      compensations.add { ctx.runBlock("Cancel hotel") { cancelHotel(req.customerId) } }
      ctx.runBlock("Hotel reservation") { bookHotel(req.customerId, req.hotel) }
    }
    // Terminal errors tell Restate not to retry, but to compensate and fail the workflow
    catch (e: TerminalException) {
      // Undo all the steps up to this point by running the compensations
      // Restate guarantees that all compensations are executed
      compensations.reversed().forEach { it() }

      throw e
    }
  }
}

fun main() {
  RestateHttpServer.listen(endpoint { bind(BookingWorkflow()) })
}
