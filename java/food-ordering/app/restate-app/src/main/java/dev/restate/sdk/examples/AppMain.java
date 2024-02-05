/*
 * Copyright (c) 2024 - Restate Software, Inc., Restate GmbH
 *
 * This file is part of the Restate examples,
 * which is released under the MIT license.
 *
 * You can find a copy of the license in the file LICENSE
 * in the root directory of this repository or package or at
 * https://github.com/restatedev/examples/
 */

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
