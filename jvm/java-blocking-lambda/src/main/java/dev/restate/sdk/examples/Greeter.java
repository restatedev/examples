package dev.restate.sdk.examples;

import dev.restate.sdk.blocking.RestateContext;
import dev.restate.sdk.core.CoreSerdes;
import dev.restate.sdk.core.StateKey;
import dev.restate.sdk.examples.generated.*;

import static dev.restate.sdk.examples.generated.GreeterProto.*;

public class Greeter extends GreeterRestate.GreeterRestateImplBase {

  private static final StateKey<Integer> COUNT = StateKey.of("count", CoreSerdes.INT);

  @Override
  public GreetResponse greet(RestateContext context, GreetRequest request) {
    int count = context.get(COUNT).orElse(1);
    context.set(COUNT, count + 1);

    return GreetResponse.newBuilder()
            .setMessage("Hello " + request.getName() + " for the " + count + " time!")
            .build();
  }
}
