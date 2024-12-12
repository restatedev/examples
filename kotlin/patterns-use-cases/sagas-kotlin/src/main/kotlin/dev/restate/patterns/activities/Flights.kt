package dev.restate.patterns.activities

import dev.restate.sdk.annotation.Handler
import dev.restate.sdk.annotation.Service
import dev.restate.sdk.kotlin.Context
import kotlinx.serialization.Serializable
import java.util.UUID

@Serializable
data class FlightBookingRequest(val destination: String)

@Service
class Flights {
    @Handler
    fun reserve(context: Context, request: FlightBookingRequest): String {
        // this should implement the communication with the flight
        // provider's APIs
        // just return a mock random id representing the reservation
        return "flight-" + UUID.randomUUID().toString();
    }

    @Handler
    fun confirm(context: Context, flightBookingId: String) {
        // this should implement the communication with the flight
        // provider's APIs
    }

    @Handler
    fun cancel(context: Context, flightBookingId: String) {
        // this should implement the communication with the flight
        // provider's APIs
    }
}