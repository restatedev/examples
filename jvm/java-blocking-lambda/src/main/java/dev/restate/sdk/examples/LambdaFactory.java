package dev.restate.sdk.examples;

import dev.restate.sdk.lambda.LambdaRestateServer;
import dev.restate.sdk.lambda.LambdaRestateServerFactory;

public class LambdaFactory implements LambdaRestateServerFactory {
  @Override
  public LambdaRestateServer create() {
    return LambdaRestateServer.builder().withService(new Greeter()).build();
  }
}
