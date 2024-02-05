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

import dev.restate.sdk.examples.generated.GreeterGrpc;
import dev.restate.sdk.examples.generated.GreeterGrpc.GreeterBlockingStub;
import dev.restate.sdk.examples.generated.GreeterProto.GreetRequest;
import dev.restate.sdk.examples.generated.GreeterProto.GreetResponse;
import dev.restate.sdk.testing.RestateGrpcChannel;
import dev.restate.sdk.testing.RestateRunner;
import dev.restate.sdk.testing.RestateRunnerBuilder;
import io.grpc.ManagedChannel;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.RegisterExtension;

import static org.junit.jupiter.api.Assertions.assertEquals;

class GreeterTest {

  // Runner runs Restate using testcontainers and registers services
  @RegisterExtension
  private static final RestateRunner restateRunner = RestateRunnerBuilder.create()
          // Service to test
          .withService(new Greeter())
          .buildRunner();

  @Test
  void testGreet(
          // Channel to send requests to Restate services
          @RestateGrpcChannel ManagedChannel channel) {
    GreeterBlockingStub client = GreeterGrpc.newBlockingStub(channel);
    GreetResponse response = client.greet(GreetRequest.newBuilder().setName("Francesco").build());

    assertEquals("Hello Francesco for the 1 time!", response.getMessage());
  }
}
