package my.example;

import dev.restate.sdk.Context;
import dev.restate.sdk.annotation.Handler;
import dev.restate.sdk.annotation.Service;
import dev.restate.sdk.endpoint.Endpoint;
import dev.restate.sdk.http.vertx.RestateHttpServer;

import java.time.Duration;

import static my.example.Utils.sendNotification;
import static my.example.Utils.sendReminder;

@Service
public class Greeter {

  public record Greeting(String name) {}
  public record GreetingResponse(String message) {}

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

  public static void main(String[] args) {
    RestateHttpServer.listen(Endpoint.bind(new Greeter()));
  }
}
