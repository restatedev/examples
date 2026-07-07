package my.example.workflows;

import static my.example.utils.Utils.*;

import dev.restate.sdk.Restate;
import dev.restate.sdk.annotation.Workflow;
import my.example.types.User;

@Workflow
public class SignupWorkflow {

  @Workflow
  public boolean run(User user) {
    String userId = Restate.key(); // workflow ID = user ID

    // Write to database
    boolean success = Restate.run("create", Boolean.class, () -> createUser(userId, user));
    if (!success) {
      return false;
    }

    // Call APIs
    Restate.run("activate", () -> activateUser(userId));
    Restate.run("welcome", () -> sendWelcomeEmail(user));

    return true;
  }
}
