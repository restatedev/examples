package my.example.sagas.activities

import dev.restate.sdk.annotation.Handler
import dev.restate.sdk.annotation.Service
import dev.restate.sdk.kotlin.Context
import kotlinx.serialization.Serializable
import org.apache.logging.log4j.LogManager

@Serializable
data class CarRentalBookingRequest(val pickupLocation: String, val rentalDate: String)

private val logger = LogManager.getLogger("CarRentals")

@Service
class CarRentalService {
    @Handler
    fun reserve(ctx: Context, request: CarRentalBookingRequest): String {
        // this should implement the communication with the rental
        // provider's APIs
        // just return a mock random id representing the reservation
        val bookingId = ctx.random().nextUUID().toString();
        logger.info("Car rental reservation created with id: {}", bookingId);
        return bookingId;
    }

    @Handler
    fun confirm(ctx: Context, bookingId: String) {
        // this should implement the communication with the rental
        // provider's APIs
        logger.info("Car rental reservation confirmed with id: {}", bookingId);
    }

    @Handler
    fun cancel(ctx: Context, bookingId: String) {
        // this should implement the communication with the rental
        // provider's APIs
        logger.info("Car rental reservation cancelled with id: {}", bookingId);
    }
}