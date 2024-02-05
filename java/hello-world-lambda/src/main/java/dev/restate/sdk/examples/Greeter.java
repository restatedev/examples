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

import dev.restate.sdk.RestateContext;
import dev.restate.sdk.common.CoreSerdes;
import dev.restate.sdk.common.StateKey;
import dev.restate.sdk.examples.generated.*;

import static dev.restate.sdk.examples.generated.GreeterProto.*;

/**
 * This service greets the users.
 */
public class Greeter extends GreeterRestate.GreeterRestateImplBase {

  // Count state. The count is per Person name.
  // See https://docs.restate.dev/services/sdk/state for more details.
  private static final StateKey<Integer> COUNT = StateKey.of("count", CoreSerdes.INT);

  @Override
  public GreetResponse greet(RestateContext context, GreetRequest request) {
    // Get the count and increment it
    int count = context.get(COUNT).orElse(1);
    context.set(COUNT, count + 1);

    // Send the response back
    return GreetResponse.newBuilder()
            .setMessage("Hello " + request.getName() + " for the " + count + " time!")
            .build();
  }
}
