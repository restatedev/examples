package org.acme;

import dev.restate.sdk.Context;
import dev.restate.sdk.annotation.Handler;
import dev.restate.sdk.annotation.Service;
import jakarta.enterprise.context.ApplicationScoped;
import org.eclipse.microprofile.config.inject.ConfigProperty;

import java.time.Duration;

import static org.acme.Utils.sendNotification;
import static org.acme.Utils.sendReminder;

@ApplicationScoped
@Service
public class Greeter {

  @ConfigProperty(name = "greetingPrefix") String greetingPrefix;

  record Greeting(String name) {}
  record GreetingResponse(String message) {}

  @Handler
  public GreetingResponse greet(Context ctx, Greeting req) {
    // Durably execute a set of steps; resilient against failures
    String greetingId = ctx.random().nextUUID().toString();
    ctx.run("Notification", () -> sendNotification(greetingId, req.name));
    ctx.sleep(Duration.ofSeconds(1));
    ctx.run("Reminder", () -> sendReminder(greetingId, req.name));

    // Respond to caller
    return new GreetingResponse("You said hi to " + req.name + "!");
  }
}
