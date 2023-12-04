package dev.restate.sdk.examples;

import dev.restate.sdk.lambda.BaseRestateLambdaHandler;
import dev.restate.sdk.lambda.RestateLambdaEndpointBuilder;

/**
 * Handler class to use in AWS Lambda.
 */
public class LambdaHandler extends BaseRestateLambdaHandler {
  @Override
  public void register(RestateLambdaEndpointBuilder builder) {
    // Register the service Greeter to be served within this Lambda
    builder.withService(new Greeter());
  }
}
