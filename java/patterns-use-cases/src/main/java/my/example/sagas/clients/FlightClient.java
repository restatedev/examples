package my.example.sagas.clients;

import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;

public class FlightClient {
  private static final Logger logger = LogManager.getLogger(FlightClient.class);

  public record FlightRequest(String flightId, String passengerName) {}

  public static void book(String customerId, FlightRequest request) {
    // this should implement the communication with the flight provider's APIs
    // just return a mock random id representing the reservation
    logger.info("Flight reservation created for customer: {}", customerId);
  }

  public static void cancel(String customerId) {
    // this should implement the communication with the flight provider's APIs
    logger.info("Flight reservation cancelled for customer id: {}", customerId);
  }
}
