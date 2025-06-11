// Copyright (c) 2023 - Restate Software, Inc., Restate GmbH
//
// This file is part of the Restate Java SDK,
// which is released under the MIT license.
//
// You can find a copy of the license in file LICENSE in the root
// directory of this repository or package, or at
// https://github.com/restatedev/sdk-java/blob/main/LICENSE
package com.example.restatestarter

import com.example.restatestarter.Greeter.Greeting
import dev.restate.client.Client
import dev.restate.sdk.testing.BindService
import dev.restate.sdk.testing.RestateClient
import dev.restate.sdk.testing.RestateTest
import kotlinx.coroutines.test.runTest
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.Timeout
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.context.SpringBootTest

@SpringBootTest(classes = [Greeter::class], properties = ["greetingPrefix=ciao"])
@RestateTest
class GreeterTest {
  @Autowired
  @BindService
  lateinit var greeter: Greeter

  @Test
  @Timeout(value = 10)
  fun greet(@RestateClient ingressClient: Client) = runTest {
    val client = GreeterClient.fromClient(ingressClient)

    assertThat(client.greet(Greeting("Francesco")).message).isEqualTo("You said ciao to Francesco!")
  }
}
