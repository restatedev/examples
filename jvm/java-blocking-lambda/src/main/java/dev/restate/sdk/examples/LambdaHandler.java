package dev.restate.sdk.examples;

import dev.restate.sdk.lambda.BaseRestateLambdaHandler;
import dev.restate.sdk.lambda.RestateLambdaEndpointBuilder;

public class LambdaHandler extends BaseRestateLambdaHandler {
  @Override
  public void register(RestateLambdaEndpointBuilder builder) {
builder.withService(new Greeter());
  }
}
