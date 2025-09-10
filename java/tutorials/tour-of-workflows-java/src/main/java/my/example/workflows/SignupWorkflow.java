package my.example.workflows;

import static my.example.utils.Utils.*;

import dev.restate.sdk.WorkflowContext;
import dev.restate.sdk.annotation.Workflow;
import my.example.types.User;

@Workflow
public class SignupWorkflow {

  @Workflow
  public boolean run(WorkflowContext ctx, User user) {
    String userId = ctx.key(); // workflow ID = user ID

    // Write to database
    boolean success = ctx.run("create", Boolean.class, () -> createUser(userId, user));
    if (!success) {
      return false;
    }

    // Call APIs
    ctx.run("activate", () -> activateUser(userId));
    ctx.run("welcome", () -> sendWelcomeEmail(user));

    return true;
  }
}
