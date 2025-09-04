package my.example.auxiliary.clients;

import java.util.UUID;
import my.example.auxiliary.types.PaymentRequest;

public class PaymentClient {
  public static String createRecurringPayment(String s, String paymentId) {
    System.out.printf(">>> Creating recurring payment %s\n", paymentId);
    return UUID.randomUUID().toString();
  }

  public static void removeRecurringPayment(String paymentId) {
    System.out.printf(">>> Removing recurring payment %s\n", paymentId);
  }

  public static String initPayment(PaymentRequest req, String paymentId) {
    System.out.printf(
        ">>> Initiating external payment %s \n"
            + "  Confirm the payment via: \n"
            + "  - For Payments service: curl localhost:8080/Payments/confirm --json '{\"id\": \"%s\", \"result\": {\"success\": true, \"transactionId\": \"txn-123\"}}'\n"
            + "  - For PaymentsWithTimeout service: curl localhost:8080/PaymentsWithTimeout/confirm --json '{\"id\": \"%s\", \"result\": {\"success\": true, \"transactionId\": \"txn-123\"}}'\n",
        paymentId, paymentId, paymentId);
    return "payRef-" + UUID.randomUUID();
  }

  public static void cancelPayment(String payRef) {
    System.out.printf(">>> Canceling external payment with ref %s\n", payRef);
  }
}
