package dev.restate.patterns.activities

import dev.restate.sdk.annotation.Handler
import dev.restate.sdk.annotation.Service
import dev.restate.sdk.kotlin.Context
import kotlinx.serialization.Serializable
import java.util.UUID

@Serializable
data class CarRentalBookingRequest(val car: String)

@Service
class CarRentals {
    @Handler
    fun reserve(context: Context, request: CarRentalBookingRequest): String {
        // this should implement the communication with the rental
        // provider's APIs
        // just return a mock random id representing the reservation
        return "car-" + UUID.randomUUID().toString();
    }

    @Handler
    fun confirm(context: Context, carRentalBookingId: String) {
        // this should implement the communication with the rental
        // provider's APIs
    }

    @Handler
    fun cancel(context: Context, carRentalBookingId: String) {
        // this should implement the communication with the rental
        // provider's APIs
    }
}