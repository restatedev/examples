package dev.restate.sdk.examples;

import dev.restate.sdk.http.vertx.RestateHttpEndpointBuilder;

public class AppMain {
  public static void main(String[] args) {
    RestateHttpEndpointBuilder.builder()
            .withService(new OrderService())
            .withService(new OrderStatusService())
            .withService(new DriverService())
            .withService(new DeliveryService())
            .withService(new DriverPoolService())
            .withService(new DriverSimService())
            .buildAndListen();
  }
}
