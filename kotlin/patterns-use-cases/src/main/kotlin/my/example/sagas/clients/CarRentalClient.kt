package my.example.sagas.clients

import kotlinx.serialization.Serializable
import org.apache.logging.log4j.LogManager

@Serializable
data class CarRentalBookingRequest(val pickupLocation: String, val rentalDate: String)

private val logger = LogManager.getLogger("CarRentals")

fun bookCar(customerId: String, request: CarRentalBookingRequest) {
  // this should implement the communication with the rental
  // provider's APIs
  logger.info("Car rental reservation created for customer: {}", customerId)
}

fun cancelCar(customerId: String) {
  // this should implement the communication with the rental
  // provider's APIs
  logger.info("Car rental reservation cancelled for customer: {}", customerId)
}
