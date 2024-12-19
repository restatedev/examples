package my.example.eventtransactions;

import dev.restate.sdk.ObjectContext;
import dev.restate.sdk.annotation.Handler;
import dev.restate.sdk.annotation.VirtualObject;
import dev.restate.sdk.http.vertx.RestateHttpEndpointBuilder;

import java.time.Duration;

import static dev.restate.sdk.JsonSerdes.STRING;
import static my.example.eventtransactions.utils.Stubs.*;

// Implement transactional event handlers:
// e.g. update various downstream systems via API calls
@VirtualObject
public class UserFeed {

    public record SocialMediaPost(String content, String metadata) {}

    // Connect a handler to a Kafka topic. Restate manages the Kafka subscription and offsets.
    // Events are pushed in order to the Virtual Object (Kafka key = object key).
    @Handler
    public void processPost(ObjectContext ctx, SocialMediaPost post) {
        String userId = ctx.key();

        // Durable side effects: Restate persists intermediate results and replays them on failure.
        String postId = ctx.run(STRING, () -> createPost(userId, post));

        // No restrictions on the handler code: loops, sleeps, etc.
        while(ctx.run(STRING, () -> getPostStatus(postId)).equals("PENDING")) {
            // Delay processing until content moderation is complete (handler suspends when on FaaS).
            // This only blocks other posts for this user (Virtual Object), not for other users.
            ctx.sleep(Duration.ofMillis(5000));
        }

        ctx.run(() -> updateUserFeed(userId, postId));
    }

    public static void main(String[] args) {
        RestateHttpEndpointBuilder.builder()
                .bind(new UserFeed())
                .buildAndListen();
    }
}
