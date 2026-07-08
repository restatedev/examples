package my.example.workflows;

import static my.example.utils.Utils.*;

import dev.restate.sdk.Restate;
import dev.restate.sdk.annotation.Shared;
import dev.restate.sdk.annotation.Workflow;
import dev.restate.sdk.common.DurablePromiseKey;
import my.example.types.User;

@Workflow
public class SignupWithEventsWorkflow {

  private static final DurablePromiseKey<String> USER_CREATED_PROMISE =
      DurablePromiseKey.of("user-created", String.class);

  @Workflow
  public boolean run(User user) {
    String userId = Restate.key();

    boolean success = Restate.run("create", Boolean.class, () -> createUser(userId, user));
    if (!success) {
      Restate.promiseHandle(USER_CREATED_PROMISE).reject("Creation failed.");
      return false;
    }

    Restate.promiseHandle(USER_CREATED_PROMISE).resolve("User created.");

    Restate.run("activate", () -> activateUser(userId));
    Restate.run("welcome", () -> sendWelcomeEmail(user));

    return true;
  }

  @Shared
  public String waitForUserCreation() {
    return Restate.promise(USER_CREATED_PROMISE).future().await();
  }
}
