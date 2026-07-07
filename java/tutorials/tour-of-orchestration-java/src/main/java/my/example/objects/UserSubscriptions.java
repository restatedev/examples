package my.example.objects;

import dev.restate.sdk.Restate;
import dev.restate.sdk.annotation.Handler;
import dev.restate.sdk.annotation.Shared;
import dev.restate.sdk.annotation.VirtualObject;
import dev.restate.sdk.common.StateKey;
import dev.restate.serde.TypeRef;
import java.util.HashSet;
import java.util.Set;

@VirtualObject
public class UserSubscriptions {
  private static final StateKey<Set<String>> SUBSCRIPTIONS =
      StateKey.of("subscriptions", new TypeRef<>() {});
  private static final StateKey<String> LAST_UPDATED = StateKey.of("lastUpdated", String.class);

  @Handler
  public void add(String subscription) {
    var state = Restate.state();

    // Get current subscriptions
    Set<String> subscriptions = state.get(SUBSCRIPTIONS).orElse(new HashSet<>());

    // Add new subscription
    subscriptions.add(subscription);
    state.set(SUBSCRIPTIONS, subscriptions);

    // Update metrics
    state.set(LAST_UPDATED, Restate.instantNow().toString());
  }

  @Shared
  public Set<String> getSubscriptions() {
    return Restate.state().get(SUBSCRIPTIONS).orElse(Set.of());
  }
}
