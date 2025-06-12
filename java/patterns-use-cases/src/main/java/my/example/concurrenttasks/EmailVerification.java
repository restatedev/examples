package my.example.concurrenttasks;

import dev.restate.sdk.Context;
import dev.restate.sdk.Select;
import dev.restate.sdk.annotation.Handler;
import dev.restate.sdk.annotation.Service;
import dev.restate.sdk.common.TerminalException;
import dev.restate.sdk.endpoint.Endpoint;
import dev.restate.sdk.http.vertx.RestateHttpServer;
import my.example.concurrenttasks.utils.EmailClient;

import java.time.Duration;

import static my.example.concurrenttasks.utils.EmailClient.sendReminder;
import static my.example.concurrenttasks.utils.EmailClient.sendVerificationEmail;

/*
 * This service implements a reliable email verification workflow using Restate.
 *
 * WHAT THIS CODE DOES:
 * - Sends a verification email to a user with a unique confirmation link
 * - Waits for the user to click the verification link (up to 24 hours)
 * - Sends reminder emails every 10 seconds while waiting
 * - Handles three possible outcomes: success, failure, or timeout
 *
 * HOW RESTATE MAKES THIS RELIABLE:
 *
 * 1. DURABLE EXECUTION: The entire workflow state is persisted. If the service crashes
 *    or restarts, it resumes exactly where it left off - no lost emails, no duplicate
 *    reminders, no forgotten timeouts.
 *
 * 2. DURABLE FUTURES: The ctx.awakeable() creates a durable future that can be
 *    resolved from external systems (like a webhook when user clicks verification link).
 *    This survives service restarts and infrastructure failures.
 *
 * 3. RELIABLE TIMERS: The timers (1-day timeout, 10-second reminders) are durable
 *    and will fire correctly even if the service is down temporarily.
 *
 * 4. SELECT PATTERN: The Select.select() provides race-condition-free handling of
 *    multiple concurrent events (user confirmation, reminders, timeout) with
 *    deterministic ordering.
 *
 * 5. AUTOMATIC RETRIES: Transient failures in email sending are automatically
 *    retried by Restate's runtime without developer intervention.
 *
 * Without Restate, this would require complex state management, external job queues,
 * database transactions, and careful handling of partial failures. Restate makes
 * the code simple while providing enterprise-grade reliability guarantees.
 */
@Service
public class EmailVerification {

  private EmailClient emailClient;

  public record VerifyEmailRequest(String email, String userId) {}

  @Handler
  public String verifyEmail(Context ctx, VerifyEmailRequest req) {
    var confirmationFuture = ctx.awakeable(Boolean.class);
    ctx.run(
        "send email",
        () -> sendVerificationEmail(req.email(), confirmationFuture.id()));

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
                () -> sendReminder(req.email(), confirmationFuture.id()));
            break;
        case "timeout":
            throw new TerminalException("Verification timed out");
      }
    }
  }

  public static void main(String[] args) {
    RestateHttpServer.listen(Endpoint.bind(new EmailVerification()));
  }
}
