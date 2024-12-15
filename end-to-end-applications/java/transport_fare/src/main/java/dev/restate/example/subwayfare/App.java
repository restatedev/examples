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

package dev.restate.example.subwayfare;

import dev.restate.sdk.http.vertx.RestateHttpEndpointBuilder;

public class App {

  public static void main(String[] args) {
    RestateHttpEndpointBuilder.builder()
            .bind(new CardTracker())
            .buildAndListen(9081);
  }
}
