package my.example.auxiliary.clients;

import dev.restate.sdk.common.TerminalException;

public class SubscriptionClient {

  private static void failOnNetflix(String subscription) {
    if ("Netflix".equals(subscription)) {
      String message = "[👻 SIMULATED] \"Netflix subscription failed: Netflix API down...\"";
      System.err.println(message);
      throw new RuntimeException(message);
    }
  }

  private static void terminalErrorOnDisney(String subscription) {
    if ("Disney".equals(subscription)) {
      String message = "[👻 SIMULATED] \"Disney subscription is not available in this region\"";
      System.err.println(message);
      throw new TerminalException(message);
    }
  }

  // <start_subscription>
  public static String createSubscription(String userId, String subscription, String paymentRef) {
    failOnNetflix(subscription);
    terminalErrorOnDisney(subscription);
    System.out.println(">>> Created subscription " + subscription + " for user " + userId);
    return "SUCCESS";
  }

  // <end_subscription>

  public static void removeSubscription(String userId, String subscription) {
    System.out.println(">>> Removed subscription " + subscription + " for user " + userId);
  }
}
