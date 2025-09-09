package com.example.workflows.workflows;

import static com.example.workflows.utils.Utils.activateUser;
import static com.example.workflows.utils.Utils.sendWelcomeEmail;

import com.example.workflows.types.CreateUserRequest;
import com.example.workflows.types.User;
import dev.restate.sdk.WorkflowContext;
import dev.restate.sdk.annotation.Workflow;

@Workflow
public class SignupWithActivitiesWorkflow {

  @Workflow
  public boolean run(WorkflowContext ctx, User user) {
    String userId = ctx.key();

    // Move user DB interaction to dedicated service
    CreateUserRequest createUserReq = new CreateUserRequest(userId, user);
    boolean success = true;//UserServiceClient.fromContext(ctx).createUser(createUserReq).await();

    if (!success) {
      return false;
    }

    // Execute other steps inline
    ctx.run("activate", () -> activateUser(userId));
    ctx.run("welcome", () -> sendWelcomeEmail(user));

    return true;
  }
}
