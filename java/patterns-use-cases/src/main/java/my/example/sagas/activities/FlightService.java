package my.example.sagas.activities;

import dev.restate.sdk.Context;
import dev.restate.sdk.annotation.Handler;
import dev.restate.sdk.annotation.Service;
import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;

@Service
public class FlightService {
  private static final Logger logger = LogManager.getLogger(FlightService.class);

  public record FlightBookingRequest(String flightId, String passengerName) {}

  @Handler
  public String reserve(Context ctx, FlightBookingRequest request) {
    // this should implement the communication with the flight
    // provider's APIs
    // just return a mock random id representing the reservation
    String bookingId = ctx.random().nextUUID().toString();
    logger.info("Flight reservation created with id: {}", bookingId);
    return bookingId;
  }

  @Handler
  public void confirm(Context ctx, String flightBookingId) {
    // this should implement the communication with the flight
    // provider's APIs
    logger.info("Flight reservation confirmed with id: {}", flightBookingId);
  }

  @Handler
  public void cancel(Context ctx, String flightBookingId) {
    // this should implement the communication with the flight
    // provider's APIs
    logger.info("Flight reservation cancelled with id: {}", flightBookingId);
  }
}
