package my.example.sagas.clients;

import java.util.UUID;
import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;

public class CarRentalClient {
  private static final Logger logger = LogManager.getLogger(CarRentalClient.class);

  public record CarRentalRequest(String pickupLocation, String rentalDate) {}

  public static String reserve(CarRentalRequest request) {
    // this should implement the communication with the rental
    // provider's APIs
    // just return a mock random id representing the reservation
    String bookingId = UUID.randomUUID().toString();
    logger.info("Car rental reservation created with id: {}", bookingId);
    return bookingId;
  }

  public static void confirm(String bookingId) {
    // this should implement the communication with the rental
    // provider's APIs
    logger.info("Car rental reservation confirmed with id: {}", bookingId);
  }

  public static void cancel(String bookingId) {
    // this should implement the communication with the rental
    // provider's APIs
    logger.info("Car rental reservation cancelled with id: {}", bookingId);
  }
}
