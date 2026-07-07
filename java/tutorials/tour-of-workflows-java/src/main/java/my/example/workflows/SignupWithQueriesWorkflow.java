package my.example.workflows;

import static my.example.utils.Utils.*;

import dev.restate.sdk.Restate;
import dev.restate.sdk.annotation.Shared;
import dev.restate.sdk.annotation.Workflow;
import dev.restate.sdk.common.StateKey;
import my.example.types.StatusResponse;
import my.example.types.User;

@Workflow
public class SignupWithQueriesWorkflow {

  private static final StateKey<User> USER = StateKey.of("user", User.class);
  private static final StateKey<String> STATUS = StateKey.of("status", String.class);

  @Workflow
  public boolean run(User user) {
    String userId = Restate.key();
    var state = Restate.state();

    state.set(USER, user);
    boolean success = Restate.run("create", Boolean.class, () -> createUser(userId, user));
    if (!success) {
      state.set(STATUS, "failed");
      return false;
    }
    state.set(STATUS, "created");

    Restate.run("activate", () -> activateUser(userId));
    Restate.run("welcome", () -> sendWelcomeEmail(user));

    return true;
  }

  @Shared
  public StatusResponse getStatus() {
    var state = Restate.state();
    String status = state.get(STATUS).orElse("unknown");
    User user = state.get(USER).orElse(null);
    return new StatusResponse(status, user);
  }
}
