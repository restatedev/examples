package my.example.workflows;

import static my.example.utils.Utils.*;

import dev.restate.sdk.Restate;
import dev.restate.sdk.Select;
import dev.restate.sdk.annotation.Shared;
import dev.restate.sdk.annotation.Workflow;
import dev.restate.sdk.common.DurablePromiseKey;
import dev.restate.sdk.common.TerminalException;
import java.time.Duration;
import my.example.types.User;
import my.example.types.VerifyEmailRequest;

@Workflow
public class SignupWithTimersWorkflow {

  private static final DurablePromiseKey<String> EMAIL_VERIFIED_PROMISE =
      DurablePromiseKey.of("email-verified", String.class);

  @Workflow
  public boolean run(User user) {
    String userId = Restate.key();

    var confirmationFuture = Restate.promise(EMAIL_VERIFIED_PROMISE).future();
    var secret = Restate.random().nextUUID().toString();
    Restate.run("verify", () -> sendVerificationEmail(userId, user, secret));

    var verificationTimeout = Restate.timer(Duration.ofDays(1));

    while (true) {
      var reminderTimer = Restate.timer(Duration.ofSeconds(10));

      var selected =
          Select.<String>select()
              .when(confirmationFuture, res -> "verified")
              .when(reminderTimer, unused -> "reminder")
              .when(verificationTimeout, unused -> "timeout")
              .await();

      switch (selected) {
        case "verified":
          var clickedSecret = confirmationFuture.await();
          return secret.equals(clickedSecret);
        case "reminder":
          Restate.run("send reminder", () -> sendReminderEmail(userId, user, secret));
          break;
        case "timeout":
          throw new TerminalException("Verification timed out");
      }
    }
  }

  @Shared
  public void verifyEmail(VerifyEmailRequest req) {
    Restate.promiseHandle(EMAIL_VERIFIED_PROMISE).resolve(req.secret());
  }
}
