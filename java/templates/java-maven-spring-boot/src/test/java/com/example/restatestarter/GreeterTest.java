// Copyright (c) 2023 - Restate Software, Inc., Restate GmbH
//
// This file is part of the Restate Java SDK,
// which is released under the MIT license.
//
// You can find a copy of the license in file LICENSE in the root
// directory of this repository or package, or at
// https://github.com/restatedev/sdk-java/blob/main/LICENSE
package com.example.restatestarter;

import com.example.restatestarter.Greeter.Greeting;
import dev.restate.client.Client;
import dev.restate.sdk.testing.*;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.Timeout;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest(
    classes = Greeter.class,
    properties = {"greetingPrefix=ciao"})
@RestateTest
public class GreeterTest {

  @Autowired @BindService private Greeter greeter;

  @Test
  @Timeout(value = 10)
  void greet(@RestateClient Client ingressClient) {
    var client = GreeterClient.fromClient(ingressClient);

    var response = client.greet(new Greeting("Francesco"));
    assertThat(response.message()).isEqualTo("You said ciao to Francesco!");
  }
}
