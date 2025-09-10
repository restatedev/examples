package my.example.workflows;

import static my.example.utils.Utils.*;

import dev.restate.sdk.WorkflowContext;
import dev.restate.sdk.annotation.Workflow;
import dev.restate.sdk.common.RetryPolicy;
import dev.restate.sdk.common.TerminalException;
import java.time.Duration;
import my.example.types.User;

@Workflow
public class SignupWithRetriesWorkflow {

  @Workflow
  public boolean run(WorkflowContext ctx, User user) {
    String userId = ctx.key();

    boolean success = ctx.run(Boolean.class, () -> createUser(userId, user));
    if (!success) {
      return false;
    }

    ctx.run("activate", () -> activateUser(userId));

    // Configure retry policy
    // <start_retries>
    try {
      RetryPolicy myRunRetryPolicy =
          RetryPolicy.defaultPolicy()
              .setInitialDelay(Duration.ofMillis(500))
              .setExponentiationFactor(2)
              .setMaxDelay(Duration.ofSeconds(10))
              .setMaxAttempts(3)
              .setMaxDuration(Duration.ofSeconds(30));

      ctx.run("welcome", myRunRetryPolicy, () -> sendWelcomeEmail(user));
    } catch (TerminalException error) {
      // This gets hit on retry exhaustion with a terminal error
      // Log and continue; without letting the workflow fail
      System.err.println("Failed to send welcome email after retries: " + error.getMessage());
    }
    // <end_retries>

    return true;
  }
}
