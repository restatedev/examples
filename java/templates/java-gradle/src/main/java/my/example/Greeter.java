package my.example;

import dev.restate.sdk.Restate;
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
    public GreetingResponse greet(Greeting req) {
        // Durably execute a set of steps; resilient against failures
        String greetingId = Restate.random().nextUUID().toString();
        Restate.run("Notification", () -> sendNotification(greetingId, req.name));
        Restate.sleep(Duration.ofSeconds(1));
        Restate.run("Reminder", () -> sendReminder(greetingId, req.name));

        // Respond to caller
        return new GreetingResponse("You said hi to " + req.name + "!");
    }

    public static void main(String[] args) {
        RestateHttpServer.listen(Endpoint.bind(new Greeter()));
    }
}
