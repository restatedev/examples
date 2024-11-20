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

package my.example;

import dev.restate.sdk.Context;
import dev.restate.sdk.annotation.Handler;
import dev.restate.sdk.annotation.Service;
import dev.restate.sdk.http.vertx.RestateHttpEndpointBuilder;

import java.time.Duration;

import static my.example.Utils.sendNotification;
import static my.example.Utils.sendReminder;

@Service
public class Greeter {

  @Handler
  public String greet(Context ctx, String name) {
    // Durably execute a set of steps; resilient against failures
    String greetingId = ctx.random().nextUUID().toString();
    ctx.run(() -> sendNotification(greetingId, name));
    ctx.sleep(Duration.ofMillis(1000));
    ctx.run(() -> sendReminder(greetingId));

    // Respond to caller
    return "You said hi to " + name + "!";
  }

  public static void main(String[] args) {
    RestateHttpEndpointBuilder.builder()
            .bind(new Greeter())
            .buildAndListen();
  }
}
