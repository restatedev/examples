package my.example.workflows;

import dev.restate.sdk.SharedWorkflowContext;
import dev.restate.sdk.WorkflowContext;
import dev.restate.sdk.annotation.Shared;
import dev.restate.sdk.annotation.Workflow;
import dev.restate.sdk.common.DurablePromiseKey;
import my.example.types.User;
import my.example.types.VerifyEmailRequest;

import static my.example.utils.Utils.*;

@Workflow
public class SignupWithSignalsWorkflow {

  private static final DurablePromiseKey<String> EMAIL_VERIFIED_PROMISE =
      DurablePromiseKey.of("email-verified", String.class);

  @Workflow
  public boolean run(WorkflowContext ctx, User user) {
    String userId = ctx.key();

    // Generate verification secret and send email
    String secret = ctx.random().nextUUID().toString();
    ctx.run("verify", () -> sendVerificationEmail(userId, user, secret));

    // Wait for user to click verification link
    String clickedSecret = ctx.promise(EMAIL_VERIFIED_PROMISE).future().await();
    return secret.equals(clickedSecret);
  }

  @Shared
  public void verifyEmail(SharedWorkflowContext ctx, VerifyEmailRequest req) {
    ctx.promiseHandle(EMAIL_VERIFIED_PROMISE).resolve(req.secret());
  }
}
