package my.example.workflows;

import static my.example.utils.Utils.*;

import dev.restate.sdk.WorkflowContext;
import dev.restate.sdk.annotation.Workflow;
import dev.restate.sdk.common.TerminalException;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import my.example.types.User;

@Workflow
public class SignupWithSagasWorkflow {

  @Workflow
  public boolean run(WorkflowContext ctx, User user) {
    String userId = ctx.key();
    List<Runnable> compensations = new ArrayList<>();

    try {
      compensations.add(() -> ctx.run("delete", () -> deleteUser(userId)));
      ctx.run("create", () -> createUser(userId, user));

      compensations.add(() -> ctx.run("deactivate", () -> deactivateUser(userId)));
      ctx.run("activate", () -> activateUser(userId));

      compensations.add(() -> ctx.run("unsubscribe", () -> cancelSubscription(user)));
      ctx.run("subscribe", () -> subscribeToPaidPlan(user));

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
