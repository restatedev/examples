package my.example.workflows;

import static my.example.utils.Utils.*;

import dev.restate.sdk.Restate;
import dev.restate.sdk.annotation.Workflow;
import dev.restate.sdk.common.TerminalException;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import my.example.types.User;

@Workflow
public class SignupWithSagasWorkflow {

  @Workflow
  public boolean run(User user) {
    String userId = Restate.key();
    List<Runnable> compensations = new ArrayList<>();

    try {
      compensations.add(() -> Restate.run("delete", () -> deleteUser(userId)));
      Restate.run("create", () -> createUser(userId, user));

      compensations.add(() -> Restate.run("deactivate", () -> deactivateUser(userId)));
      Restate.run("activate", () -> activateUser(userId));

      compensations.add(() -> Restate.run("unsubscribe", () -> cancelSubscription(user)));
      Restate.run("subscribe", () -> subscribeToPaidPlan(user));

    } catch (TerminalException e) {
      // Run compensations in reverse order
      Collections.reverse(compensations);
      for (Runnable compensation : compensations) {
        compensation.run();
      }
      return false;
    }

    return true;
  }
}
