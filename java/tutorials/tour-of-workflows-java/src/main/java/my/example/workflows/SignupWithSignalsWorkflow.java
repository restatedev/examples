package my.example.workflows;

import static my.example.utils.Utils.*;

import dev.restate.sdk.Restate;
import dev.restate.sdk.annotation.Shared;
import dev.restate.sdk.annotation.Workflow;
import dev.restate.sdk.common.DurablePromiseKey;
import my.example.types.User;
import my.example.types.VerifyEmailRequest;

@Workflow
public class SignupWithSignalsWorkflow {

  private static final DurablePromiseKey<String> EMAIL_VERIFIED_PROMISE =
      DurablePromiseKey.of("email-verified", String.class);

  @Workflow
  public boolean run(User user) {
    String userId = Restate.key();

    // Generate verification secret and send email
    String secret = Restate.random().nextUUID().toString();
    Restate.run("verify", () -> sendVerificationEmail(userId, user, secret));

    // Wait for user to click verification link
    String clickedSecret = Restate.promise(EMAIL_VERIFIED_PROMISE).future().await();
    return secret.equals(clickedSecret);
  }

  @Shared
  public void verifyEmail(VerifyEmailRequest req) {
    Restate.promiseHandle(EMAIL_VERIFIED_PROMISE).resolve(req.secret());
  }
}
