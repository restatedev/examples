package dev.restate.sdk.examples;

import dev.restate.sdk.examples.external.DriverSimService;
import dev.restate.sdk.http.vertx.RestateHttpEndpointBuilder;

public class AppMain {
  public static void main(String[] args) {
    RestateHttpEndpointBuilder.builder()
        .withService(new OrderService())
        .withService(new OrderStatusService())
        .withService(new DriverService())
        .withService(new DeliveryService())
        .withService(new DriverPoolService())
        .withService(new DriverSimService()) // external mobile app on driver's phone
        .buildAndListen();
  }
}
