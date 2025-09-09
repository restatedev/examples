package my.example.workflows;

import dev.restate.sdk.WorkflowContext;
import dev.restate.sdk.annotation.Workflow;
import my.example.types.CreateUserRequest;
import my.example.types.User;
import my.example.utils.UserServiceClient;

import static my.example.utils.Utils.activateUser;
import static my.example.utils.Utils.sendWelcomeEmail;

@Workflow
public class SignupWithActivitiesWorkflow {

  @Workflow
  public boolean run(WorkflowContext ctx, User user) {
    String userId = ctx.key();

    // <start_activities>
    // Move user DB interaction to dedicated service
    boolean success = true;
    UserServiceClient.fromContext(ctx).createUser(new CreateUserRequest(userId, user)).await();

    if (!success) {
      return false;
    }

    // Execute other steps inline
    ctx.run("activate", () -> activateUser(userId));
    ctx.run("welcome", () -> sendWelcomeEmail(user));
    // <end_activities>

    return true;
  }
}
