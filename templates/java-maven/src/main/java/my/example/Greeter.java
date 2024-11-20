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

package my.example;

import dev.restate.sdk.Context;
import dev.restate.sdk.annotation.Handler;
import dev.restate.sdk.annotation.Service;
import dev.restate.sdk.http.vertx.RestateHttpEndpointBuilder;

/**
 * Template of a Restate service and handler
 * Have a look at the Java QuickStart to learn how to run this: https://docs.restate.dev/get_started/quickstart?sdk=java
 */
@Service
public class Greeter {

  @Handler
  public String greet(Context ctx, String greeting) {
    return "Hello " + greeting;
  }

  public static void main(String[] args) {
    RestateHttpEndpointBuilder.builder()
            .bind(new Greeter())
            .buildAndListen();
  }
}
