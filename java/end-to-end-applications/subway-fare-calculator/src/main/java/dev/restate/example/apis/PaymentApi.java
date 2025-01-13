package dev.restate.example.apis;

import java.io.IOException;

public final class PaymentApi {

  public static boolean runAuthorization(String cardRef) throws IOException  {
    if (cardRef.endsWith("1")) {
      return true;
    }

    if (cardRef.endsWith("9")) {
      return false;
    }
    if (cardRef.endsWith("8")) {
      Utils.threadSleep(10_000);
      return true;
    }

    final long delay = (long) (1000 + Math.random() * 1000);
    Utils.threadSleep(delay);

    return true;
  }

  public static boolean makePayment(String cardRef, long amountCents) throws IOException  {
    if (cardRef.endsWith("1")) {
      return true;
    }

    if (cardRef.endsWith("9")) {
      return false;
    }
    if (cardRef.endsWith("8")) {
      Utils.threadSleep(10_000);
      return true;
    }

    final long delay = (long) (1000 + Math.random() * 1000);
    Utils.threadSleep(delay);

    return true;
  }
}
