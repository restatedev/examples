package my.example.sagas.clients;

import dev.restate.sdk.common.TerminalException;
import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;

public class HotelClient {
  private static final Logger logger = LogManager.getLogger(HotelClient.class);

  public record HotelRequest(String arrivalDate, String departureDate) {}

  public static void book(String customerId, HotelRequest request) {
    // this should implement the communication with the flight provider's APIs
    // just return a mock random id representing the reservation
    logger.info("Hotel reservation created for customer id: {}", customerId);
    logger.error("[👻 SIMULATED] This hotel is fully booked!");
    throw new TerminalException("[👻 SIMULATED] This hotel is fully booked!");
  }

  public static void cancel(String customerId) {
    // this should implement the communication with the flight provider's APIs
    logger.info("Hotel reservation cancelled for customer id: {}", customerId);
  }
}
