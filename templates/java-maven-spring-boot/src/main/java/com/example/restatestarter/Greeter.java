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

package com.example.restatestarter;

import dev.restate.sdk.Context;
import dev.restate.sdk.annotation.Handler;
import dev.restate.sdk.annotation.Service;
import dev.restate.sdk.http.vertx.RestateHttpEndpointBuilder;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.time.Duration;

import static com.example.restatestarter.Utils.sendNotification;
import static com.example.restatestarter.Utils.sendReminder;

/**
 * Template of a Restate service and handler.
 */
@Component
@Service
public class Greeter {

  @Value("${greetingPrefix}")
  private String greetingPrefix;

  @Handler
  public String greet(Context ctx, String name) {
    // Durably execute a set of steps; resilient against failures
    String greetingId = ctx.random().nextUUID().toString();
    ctx.run(() -> sendNotification(greetingId, name));
    ctx.sleep(Duration.ofMillis(1000));
    ctx.run(() -> sendReminder(greetingId));

    // Respond to caller
    return "You said " + greetingPrefix + " to " + name + "!";
  }
}
