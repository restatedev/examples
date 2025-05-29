package my.example.sagas.clients;

import java.util.UUID;
import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;

public class FlightClient {
  private static final Logger logger = LogManager.getLogger(FlightClient.class);

  public record FlightBookingRequest(String flightId, String passengerName) {}

  public static String reserve(FlightBookingRequest request) {
    // this should implement the communication with the flight provider's APIs
    // just return a mock random id representing the reservation
    String bookingId = UUID.randomUUID().toString();
    logger.info("Flight reservation created with id: {}", bookingId);
    return bookingId;
  }

  public static void confirm(String flightBookingId) {
    // this should implement the communication with the flight provider's APIs
    logger.info("Flight reservation confirmed with id: {}", flightBookingId);
  }

  public static void cancel(String flightBookingId) {
    // this should implement the communication with the flight provider's APIs
    logger.info("Flight reservation cancelled with id: {}", flightBookingId);
  }
}
