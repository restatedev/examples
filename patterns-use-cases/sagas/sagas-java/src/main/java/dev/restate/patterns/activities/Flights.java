package dev.restate.patterns.activities;

import dev.restate.patterns.BookingWorkflow.TravelBookingRequest;
import dev.restate.sdk.Context;
import dev.restate.sdk.annotation.Handler;
import dev.restate.sdk.annotation.Service;

import java.util.UUID;

@Service
public class Flights {

  public record FlightBookingRequest(TravelBookingRequest req /* flight number, class, ... */) {}

  @Handler
  public String reserve(Context ctx, FlightBookingRequest request) {
    // this should implement the communication with the rental
    // provider's APIs
    // just return a mock random id representing the reservation
    return "car-" + UUID.randomUUID().toString();
  }

  @Handler
  public void confirm(Context ctx, String flightBookingId) {
    // this should implement the communication with the rental
    // provider's APIs
  }

  @Handler
  public void cancel(Context ctx, String flightBookingId) {
    // this should implement the communication with the rental
    // provider's APIs
  }
}
