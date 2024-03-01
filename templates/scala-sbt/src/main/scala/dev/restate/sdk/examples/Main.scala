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

package dev.restate.sdk.examples

import dev.restate.sdk.http.vertx.RestateHttpEndpointBuilder

object Main {
  def main(args: Array[String]): Unit = {
    RestateHttpEndpointBuilder.builder()
      // Register the service Greeter
      .withService(new Greeter())
      // Start the Restate Endpoint HTTP Server
      .buildAndListen();
  }
}
