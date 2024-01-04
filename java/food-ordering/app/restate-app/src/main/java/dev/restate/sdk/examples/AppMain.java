package dev.restate.sdk.examples;

import dev.restate.sdk.examples.external.DriverMobileAppSimulator;
import dev.restate.sdk.http.vertx.RestateHttpEndpointBuilder;

public class AppMain {
  public static void main(String[] args) {
    RestateHttpEndpointBuilder.builder()
        .withService(new OrderWorkflow())
        .withService(new OrderStatusService())
        .withService(new DeliveryManager())
        .withService(new DriverDeliveryMatcher())
        .withService(new DriverDigitalTwin())
        .withService(new DriverMobileAppSimulator()) // external mobile app on driver's phone
        .buildAndListen();
  }
}
