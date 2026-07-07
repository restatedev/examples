package my.example;

import static my.example.Utils.sendNotification;
import static my.example.Utils.sendReminder;

import dev.restate.sdk.Restate;
import dev.restate.sdk.annotation.Handler;
import dev.restate.sdk.annotation.Service;
import java.time.Duration;

@Service
public class Greeter {

  @Handler
  public String greet(String name) {
    // Durably execute a set of steps; resilient against failures
    String greetingId = Restate.random().nextUUID().toString();
    Restate.run("send-notification", () -> sendNotification(greetingId, name));
    Restate.sleep(Duration.ofMillis(1000));
    Restate.run("send-reminder", () -> sendReminder(greetingId));

    // Respond to caller
    return "You said hi to " + name + "!";
  }
}
