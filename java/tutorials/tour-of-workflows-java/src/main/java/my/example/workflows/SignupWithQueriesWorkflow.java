package my.example.workflows;

import dev.restate.sdk.SharedWorkflowContext;
import dev.restate.sdk.WorkflowContext;
import dev.restate.sdk.annotation.Shared;
import dev.restate.sdk.annotation.Workflow;
import dev.restate.sdk.common.StateKey;
import my.example.types.StatusResponse;
import my.example.types.User;

import static my.example.utils.Utils.*;

@Workflow
public class SignupWithQueriesWorkflow {

  private static final StateKey<User> USER = StateKey.of("user", User.class);
  private static final StateKey<String> STATUS = StateKey.of("status", String.class);

  @Workflow
  public boolean run(WorkflowContext ctx, User user) {
    String userId = ctx.key();

    ctx.set(USER, user);
    boolean success = ctx.run("create", Boolean.class, () -> createUser(userId, user));
    if (!success) {
      ctx.set(STATUS, "failed");
      return false;
    }
    ctx.set(STATUS, "created");

    ctx.run("activate", () -> activateUser(userId));
    ctx.run("welcome", () -> sendWelcomeEmail(user));

    return true;
  }

  @Shared
  public StatusResponse getStatus(SharedWorkflowContext ctx) {
    String status = ctx.get(STATUS).orElse("unknown");
    User user = ctx.get(USER).orElse(null);
    return new StatusResponse(status, user);
  }
}
