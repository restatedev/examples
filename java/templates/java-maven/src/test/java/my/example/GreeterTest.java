// Copyright (c) 2023 - Restate Software, Inc., Restate GmbH
//
// This file is part of the Restate Java SDK,
// which is released under the MIT license.
//
// You can find a copy of the license in file LICENSE in the root
// directory of this repository or package, or at
// https://github.com/restatedev/sdk-java/blob/main/LICENSE
package my.example;

import dev.restate.client.Client;
import dev.restate.sdk.testing.BindService;
import dev.restate.sdk.testing.RestateClient;
import dev.restate.sdk.testing.RestateTest;
import my.example.Greeter.Greeting;
import my.example.Greeter.GreetingResponse;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.Timeout;

import static org.junit.jupiter.api.Assertions.assertEquals;

@RestateTest
class GreeterTest {

  @BindService
  private final Greeter greeter = new Greeter();

  @Test
  @Timeout(value = 10)
  void testGreet(@RestateClient Client ingressClient) {
    var client = GreeterClient.fromClient(ingressClient);

    GreetingResponse response = client.greet(new Greeting("Francesco"));
    assertEquals(response.message(), "You said hi to Francesco!");
  }
}
