package my.example.sagas.activities

import dev.restate.sdk.annotation.Handler
import dev.restate.sdk.annotation.Service
import dev.restate.sdk.kotlin.Context
import kotlinx.serialization.Serializable
import org.apache.logging.log4j.LogManager
import java.util.UUID

@Serializable
data class FlightBookingRequest(val flightId: String, val passengerName: String)

private val logger = LogManager.getLogger("Flights")

@Service
class FlightService {
    @Handler
    fun reserve(ctx: Context, request: FlightBookingRequest): String {
        // this should implement the communication with the flight
        // provider's APIs
        // just return a mock random id representing the reservation
        val bookingId = ctx.random().nextUUID().toString();
        logger.info("Flight reservation created with id: {}", bookingId);
        return "flight-" + UUID.randomUUID().toString();
    }

    @Handler
    fun confirm(ctx: Context, flightBookingId: String) {
        // this should implement the communication with the flight
        // provider's APIs
        logger.info("Flight reservation confirmed with id: {}", flightBookingId);
    }

    @Handler
    fun cancel(ctx: Context, flightBookingId: String) {
        // this should implement the communication with the flight
        // provider's APIs
        logger.info("Flight reservation cancelled with id: {}", flightBookingId);
    }
}