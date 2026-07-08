package my.example.workflows;

import static my.example.utils.Utils.activateUser;
import static my.example.utils.Utils.sendWelcomeEmail;

import dev.restate.sdk.Restate;
import dev.restate.sdk.annotation.Workflow;
import my.example.types.CreateUserRequest;
import my.example.types.User;
import my.example.utils.UserService;

@Workflow
public class SignupWithActivitiesWorkflow {

  @Workflow
  public boolean run(User user) {
    String userId = Restate.key();

    // <start_activities>
    // Move user DB interaction to dedicated service
    boolean success = true;
    Restate.service(UserService.class).createUser(new CreateUserRequest(userId, user));

    if (!success) {
      return false;
    }

    // Execute other steps inline
    Restate.run("activate", () -> activateUser(userId));
    Restate.run("welcome", () -> sendWelcomeEmail(user));
    // <end_activities>

    return true;
  }
}
