package my.example.workflows;

import static my.example.utils.Utils.*;

import dev.restate.sdk.SharedWorkflowContext;
import dev.restate.sdk.WorkflowContext;
import dev.restate.sdk.annotation.Shared;
import dev.restate.sdk.annotation.Workflow;
import dev.restate.sdk.common.DurablePromiseKey;
import my.example.types.User;

@Workflow
public class SignupWithEventsWorkflow {

  private static final DurablePromiseKey<String> USER_CREATED_PROMISE =
      DurablePromiseKey.of("user-created", String.class);

  @Workflow
  public boolean run(WorkflowContext ctx, User user) {
    String userId = ctx.key();

    boolean success = ctx.run("create", Boolean.class, () -> createUser(userId, user));
    if (!success) {
      ctx.promiseHandle(USER_CREATED_PROMISE).reject("Creation failed.");
      return false;
    }

    ctx.promiseHandle(USER_CREATED_PROMISE).resolve("User created.");

    ctx.run("activate", () -> activateUser(userId));
    ctx.run("welcome", () -> sendWelcomeEmail(user));

    return true;
  }

  @Shared
  public String waitForUserCreation(SharedWorkflowContext ctx) {
    return ctx.promise(USER_CREATED_PROMISE).future().await();
  }
}
