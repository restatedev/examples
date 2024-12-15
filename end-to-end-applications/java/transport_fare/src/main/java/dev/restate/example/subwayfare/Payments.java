package dev.restate.example.subwayfare;

import dev.restate.example.subwayfare.apis.PaymentApi;
import dev.restate.sdk.Context;
import java.time.Duration;

import static dev.restate.sdk.JsonSerdes.BOOLEAN;

public class Payments {

  private static final int AUTH_ATTEMPTS = 3;
  private static final int ATTEMPT_DELAY = 60_000; // 1 min


  public static boolean authorizeCard(Context ctx, String cardRef) {

    for (int attempt = 1, delay = ATTEMPT_DELAY; attempt <= AUTH_ATTEMPTS; attempt++, delay *= 2) {

      boolean authorized = ctx.run("auth attempt " + attempt, BOOLEAN,
          () -> PaymentApi.runAuthorization(cardRef));

      if (authorized) {
        return true;
      }
      ctx.sleep(Duration.ofMillis(delay));
    }
    return false;
  }

  public static boolean chargeCard(Context ctx, String cardRef, long amountCents) {
    for (int attempt = 1, delay = ATTEMPT_DELAY; attempt <= AUTH_ATTEMPTS; attempt++, delay *= 2) {

      boolean success = ctx.run("charge attempt " + attempt, BOOLEAN,
          () -> PaymentApi.makePayment(cardRef, amountCents));

      if (success) {
        return true;
      }
      ctx.sleep(Duration.ofMillis(delay));
    }
    return false;
  }


}
