package my.example.sagas.activities;

import dev.restate.sdk.Context;
import dev.restate.sdk.annotation.Handler;
import dev.restate.sdk.annotation.Service;
import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;

@Service
public class CarRentalService {
  private static final Logger logger = LogManager.getLogger(CarRentalService.class);

  public record CarRentalRequest(String pickupLocation, String rentalDate) {}

  @Handler
  public String reserve(Context ctx, CarRentalRequest request) {
    // this should implement the communication with the rental
    // provider's APIs
    // just return a mock random id representing the reservation
    String bookingId = ctx.random().nextUUID().toString();
    logger.info("Car rental reservation created with id: {}", bookingId);
    return bookingId;
  }

  @Handler
  public void confirm(Context ctx, String bookingId) {
    // this should implement the communication with the rental
    // provider's APIs
    logger.info("Car rental reservation confirmed with id: {}", bookingId);
  }

  @Handler
  public void cancel(Context ctx, String bookingId) {
    // this should implement the communication with the rental
    // provider's APIs
    logger.info("Car rental reservation cancelled with id: {}", bookingId);
  }
}
