package com.example.workflows.workflows;

import static com.example.workflows.utils.Utils.*;

import com.example.workflows.types.User;
import com.example.workflows.types.VerifyEmailRequest;
import dev.restate.sdk.Select;
import dev.restate.sdk.SharedWorkflowContext;
import dev.restate.sdk.WorkflowContext;
import dev.restate.sdk.annotation.Shared;
import dev.restate.sdk.annotation.Workflow;
import dev.restate.sdk.common.DurablePromiseKey;
import dev.restate.sdk.common.TerminalException;

import java.time.Duration;

@Workflow
public class SignupWithTimersWorkflow {

  private static final DurablePromiseKey<String> EMAIL_VERIFIED_PROMISE =
      DurablePromiseKey.of("email-verified", String.class);

    @Workflow
    public String run(WorkflowContext ctx, User user) {
        String userId = ctx.key();

        var confirmationFuture = ctx.awakeable(Boolean.class);
        ctx.run(
                "verify",
                () -> sendVerificationEmail(userId, user, confirmationFuture.id()));

        var verificationTimeout = ctx.timer(Duration.ofDays(1));

        while (true) {
            var reminderTimer = ctx.timer(Duration.ofSeconds(10));

            var selected =
                    Select.<String>select()
                            .when(confirmationFuture, res -> res ? "success" : "failure")
                            .when(reminderTimer, unused -> "reminder")
                            .when(verificationTimeout, unused -> "timeout")
                            .await();

            switch (selected) {
                case "success":
                    return "Email verified";
                case "failure":
                    return "Email rejected";
                case "reminder":
                    ctx.run(
                            "send reminder",
                            () -> sendReminderEmail(user));
                    break;
                case "timeout":
                    throw new TerminalException("Verification timed out");
            }
        }
    }

  @Shared
  public void verifyEmail(SharedWorkflowContext ctx, VerifyEmailRequest req) {
    ctx.promiseHandle(EMAIL_VERIFIED_PROMISE).resolve(req.secret());
  }
}
