package my.example.objects;

import dev.restate.sdk.ObjectContext;
import dev.restate.sdk.SharedObjectContext;
import dev.restate.sdk.annotation.Handler;
import dev.restate.sdk.annotation.Shared;
import dev.restate.sdk.annotation.VirtualObject;
import dev.restate.sdk.common.StateKey;
import dev.restate.serde.TypeRef;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@VirtualObject
public class UserSubscriptions {
  private static final StateKey<List<String>> SUBSCRIPTIONS =
      StateKey.of("subscriptions", new TypeRef<>() {});
  private static final StateKey<String> LAST_UPDATED = StateKey.of("lastUpdated", String.class);

  @Handler
  public void add(ObjectContext ctx, String subscription) {
    // Get current subscriptions
    List<String> subscriptions = ctx.get(SUBSCRIPTIONS).orElse(new ArrayList<>());

    // Add new subscription
    if (!subscriptions.contains(subscription)) {
      subscriptions.add(subscription);
    }
    ctx.set(SUBSCRIPTIONS, subscriptions);

    // Update metrics
    ctx.set(LAST_UPDATED, Instant.now().toString());
  }

  @Shared
  public List<String> getSubscriptions(SharedObjectContext ctx) {
    return ctx.get(SUBSCRIPTIONS).orElse(new ArrayList<>());
  }
}
