package dev.restate.sdk.examples;

import dev.restate.sdk.RestateContext;
import dev.restate.sdk.common.CoreSerdes;
import dev.restate.sdk.common.StateKey;
import dev.restate.sdk.examples.generated.*;
import dev.restate.sdk.http.vertx.RestateHttpEndpointBuilder;

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

  public static void main(String[] args) {
    RestateHttpEndpointBuilder.builder().withService(new Greeter()).buildAndListen();
  }
}
