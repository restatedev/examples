package my.example.sagas.clients;

import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;

public class CarRentalClient {
  private static final Logger logger = LogManager.getLogger(CarRentalClient.class);

  public record CarRequest(String pickupLocation, String rentalDate) {}

  public static void book(String customerId, CarRequest request) {
    // this should implement the communication with the rental
    // provider's APIs
    logger.info("Car rental reservation created for customer: {}", customerId);
  }

  public static void cancel(String bookingId) {
    // this should implement the communication with the rental
    // provider's APIs
    logger.info("Car rental reservation cancelled with id: {}", bookingId);
  }
}
