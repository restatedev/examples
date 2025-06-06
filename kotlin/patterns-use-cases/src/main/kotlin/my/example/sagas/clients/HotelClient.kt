package my.example.sagas.clients

import dev.restate.sdk.common.TerminalException
import kotlinx.serialization.Serializable
import org.apache.logging.log4j.LogManager

@Serializable data class HotelRequest(val arrivalDate: String, val departureDate: String)

private val logger = LogManager.getLogger("Hotels")

fun bookHotel(customerId: String, request: HotelRequest) {
  // this should implement the communication with the hotel
  // provider's APIs
  logger.error("[👻 SIMULATED] This hotel is fully booked!")
  throw TerminalException("[👻 SIMULATED] This hotel is fully booked!")
}

fun cancelHotel(customerId: String) {
  // this should implement the communication with the hotel
  // provider's APIs
  logger.info("Hotel reservation cancelled for customer: {}", customerId)
}
