package my.example.utils;

import dev.restate.sdk.common.TerminalException;
import my.example.types.User;

public class Utils {

  private static void failOnAlice(String name, String action) {
    if ("Alice".equals(name)) {
      System.err.println("[👻 SIMULATED] Failed to " + action + ": " + name);
      throw new RuntimeException("[👻 SIMULATED] Failed to " + action + ": " + name);
    }
  }

  // <start_here>
  private static void terminalErrorOnAlice(String name, String action) {
    if ("Alice".equals(name)) {
      String message =
          "[👻 SIMULATED] Failed to " + action + " for " + name + ": not available in this country";
      System.err.println(message);
      throw new TerminalException(message);
    }
  }
  // <end_here>

  public static void sendWelcomeEmail(User user) {
    failOnAlice(user.name(), "send welcome email");
    System.out.println("Welcome email sent: " + user.email());
  }

  public static boolean createUser(String userId, User user) {
    System.out.println("User entry created in DB: " + userId);
    return true;
  }

  public static boolean deleteUser(String userId) {
    System.out.println("User entry deleted in DB: " + userId);
    return true;
  }

  public static void sendVerificationEmail(String userId, User user, String verificationSecret) {
    System.out.println("Verification email sent: " + user.email());
    System.out.println(
        "For the signals section, verify via: curl localhost:8080/SignupWithSignalsWorkflow/"
            + userId
            + "/verifyEmail --json '{\"secret\": \""
            + verificationSecret
            + "\"}'");
    System.out.println(
        "For the timers section, verify via: curl localhost:8080/SignupWithTimersWorkflow/"
            + userId
            + "/verifyEmail --json '{\"secret\": \""
            + verificationSecret
            + "\"}'");
  }

  public static void sendReminderEmail(String userId, User user, String verificationSecret) {
    System.out.println("Reminder email sent: " + user.email());
    System.out.println(
        "For the timers section, verify via: curl localhost:8080/SignupWithTimersWorkflow/"
            + userId
            + "/verifyEmail --json '{\"secret\": \""
            + verificationSecret
            + "\"}'");
  }

  public static void activateUser(String userId) {
    System.out.println("User account activated: " + userId);
  }

  public static void deactivateUser(String userId) {
    System.out.println("User account deactivated: " + userId);
  }

  public static boolean subscribeToPaidPlan(User user) {
    terminalErrorOnAlice(user.name(), "subscribe to paid plan");
    System.out.println("User subscribed to paid plan: " + user.name());
    return true;
  }

  public static boolean cancelSubscription(User user) {
    System.out.println("User subscription cancelled: " + user.name());
    return true;
  }
}
