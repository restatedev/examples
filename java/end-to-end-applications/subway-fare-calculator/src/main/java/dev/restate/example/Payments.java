package dev.restate.example;

import dev.restate.example.apis.PaymentApi;
import dev.restate.sdk.Context;
import dev.restate.sdk.common.RetryPolicy;
import dev.restate.sdk.common.TerminalException;

import java.time.Duration;

import static dev.restate.sdk.JsonSerdes.BOOLEAN;

public class Payments {

  private static final int AUTH_ATTEMPTS = 3;
  private static final Duration ATTEMPT_DELAY = Duration.ofMinutes(1); // 1 min
  private static final RetryPolicy retryThreeTimes = RetryPolicy.defaultPolicy()
          .setMaxAttempts(AUTH_ATTEMPTS)
          .setInitialDelay(ATTEMPT_DELAY);

  public static boolean authorizeCard(Context ctx, String cardRef) {
    try {
      return ctx.run("auth attempt", BOOLEAN, retryThreeTimes, () -> PaymentApi.runAuthorization(cardRef));
    } catch (TerminalException e) {
      return false;
    }
  }

  public static boolean chargeCard(Context ctx, String cardRef, long amountCents) {
      try {
        return ctx.run("charge attempt", BOOLEAN, retryThreeTimes, () -> PaymentApi.makePayment(cardRef, amountCents));
      } catch (TerminalException e) {
        return false;
      }
  }
}
