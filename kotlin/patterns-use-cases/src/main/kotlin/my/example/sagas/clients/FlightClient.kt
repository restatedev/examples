package my.example.sagas.clients

import kotlinx.serialization.Serializable
import org.apache.logging.log4j.LogManager

@Serializable data class FlightBookingRequest(val flightId: String, val passengerName: String)

private val logger = LogManager.getLogger("Flights")

fun bookFlight(customerId: String, request: FlightBookingRequest) {
  // this should implement the communication with the flight
  // provider's APIs
  logger.info("Flight reservation created for customer: {}", customerId)
}

fun cancelFlight(customerId: String) {
  // this should implement the communication with the flight
  // provider's APIs
  logger.info("Flight reservation cancelled for customer: {}", customerId)
}
