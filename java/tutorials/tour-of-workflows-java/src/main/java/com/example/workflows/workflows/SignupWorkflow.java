package com.example.workflows.workflows;

import static com.example.workflows.utils.Utils.*;

import com.example.workflows.types.User;
import dev.restate.sdk.WorkflowContext;
import dev.restate.sdk.annotation.Workflow;

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
