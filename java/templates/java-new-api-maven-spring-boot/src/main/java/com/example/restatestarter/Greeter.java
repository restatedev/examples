package com.example.restatestarter;

import dev.restate.sdk.Restate;
import dev.restate.sdk.annotation.Handler;
import dev.restate.sdk.springboot.RestateService;
import org.springframework.beans.factory.annotation.Value;

import java.time.Duration;

import static com.example.restatestarter.Utils.sendNotification;
import static com.example.restatestarter.Utils.sendReminder;

@RestateService
public class Greeter {

  @Value("${greetingPrefix}")
  private String greetingPrefix;

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
    return new GreetingResponse("You said " + greetingPrefix + " to " + req.name + "!");
  }
}


