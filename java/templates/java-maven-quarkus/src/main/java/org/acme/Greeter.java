package org.acme;

import dev.restate.sdk.Restate;
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

  public record Greeting(String name) {}
  public record GreetingResponse(String message) {}

  @Handler
  public GreetingResponse greet(Greeting req) {
    // Durably execute a set of steps; resilient against failures
    String greetingId = Restate.random().nextUUID().toString();
    Restate.run("Notification", () -> sendNotification(greetingId, req.name));
    Restate.sleep(Duration.ofSeconds(1));
    Restate.run("Reminder", () -> sendReminder(greetingId, req.name));

    // Respond to caller
    return new GreetingResponse("You said hi to " + req.name + "!");
  }
}
