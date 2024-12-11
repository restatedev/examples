package dev.restate.patterns.activities;

import dev.restate.patterns.BookingWorkflow.TravelBookingRequest;
import dev.restate.sdk.Context;
import dev.restate.sdk.annotation.Handler;
import dev.restate.sdk.annotation.Service;

import java.util.UUID;

@Service
public class Payment {

  public record PaymentRequest(TravelBookingRequest req /* paymentToken, amount, ... */ ) {}

  @Handler
  String process(Context context, PaymentRequest request) {
    // this should implement the actual payment processing, or communication
    // to the external provider's APIs
    // just return a mock random id representing the payment
    return UUID.randomUUID().toString();
  }

  @Handler
  public void refund(Context context, String paymentId) {
    // refund the payment identified by this paymentId
    // this should implement the actual payment processing, or communication
    // to the external provider's APIs
  }
}