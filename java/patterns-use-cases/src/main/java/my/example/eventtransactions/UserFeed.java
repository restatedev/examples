package my.example.eventtransactions;

import dev.restate.sdk.ObjectContext;
import dev.restate.sdk.annotation.Handler;
import dev.restate.sdk.annotation.VirtualObject;
import dev.restate.sdk.endpoint.Endpoint;
import dev.restate.sdk.http.vertx.RestateHttpServer;

import java.time.Duration;

import static my.example.eventtransactions.utils.Stubs.createPost;
import static my.example.eventtransactions.utils.Stubs.getPostStatus;
import static my.example.eventtransactions.utils.Stubs.updateUserFeed;

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
        String postId = ctx.run(String.class, () -> createPost(userId, post));

        // No restrictions on the handler code: loops, sleeps, etc.
        while(ctx.run(String.class, () -> getPostStatus(postId)).equals("PENDING")) {
            // Delay processing until content moderation is complete (handler suspends when on FaaS).
            // This only blocks other posts for this user (Virtual Object), not for other users.
            ctx.sleep(Duration.ofSeconds(5));
        }

        ctx.run(() -> updateUserFeed(userId, postId));
    }

    public static void main(String[] args) {
        RestateHttpServer.listen(Endpoint.bind(new UserFeed()));
    }
}
