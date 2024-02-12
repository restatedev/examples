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

package examples.order;

import examples.order.external.DriverMobileAppSimulator;
import dev.restate.sdk.http.vertx.RestateHttpEndpointBuilder;

public class AppMain {
  public static void main(String[] args) {
    RestateHttpEndpointBuilder.builder()
        .with(new OrderWorkflow())
        .withService(new OrderWorkflowSubmitter())
        .withService(new OrderStatusService())
        .withService(new DriverDeliveryMatcher())
        .withService(new DriverDigitalTwin())
        .withService(new DriverMobileAppSimulator()) // external mobile app on driver's phone
        .buildAndListen();
  }
}
