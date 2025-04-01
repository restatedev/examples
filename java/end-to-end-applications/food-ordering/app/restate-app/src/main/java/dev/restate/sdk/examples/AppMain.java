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


import dev.restate.sdk.endpoint.Endpoint;
import dev.restate.sdk.http.vertx.RestateHttpServer;

public class AppMain {
  public static void main(String[] args) {
    RestateHttpServer.listen(
            Endpoint.bind(new OrderWorkflow())
                    .bind(new OrderStatusService())
                    .bind(new DeliveryManager())
                    .bind(new DriverDeliveryMatcher())
                    .bind(new DriverDigitalTwin())
    );
  }
}
