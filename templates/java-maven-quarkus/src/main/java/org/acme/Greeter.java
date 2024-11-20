package org.acme;

import dev.restate.sdk.Context;
import dev.restate.sdk.annotation.Handler;
import dev.restate.sdk.annotation.Service;
import dev.restate.sdk.http.vertx.RestateHttpEndpointBuilder;
import jakarta.enterprise.context.ApplicationScoped;
import org.eclipse.microprofile.config.inject.ConfigProperty;

import java.time.Duration;

import static org.acme.Utils.sendNotification;
import static org.acme.Utils.sendReminder;

@ApplicationScoped
@Service
public class Greeter {

  @ConfigProperty(name = "greetingPrefix") String greetingPrefix;

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
