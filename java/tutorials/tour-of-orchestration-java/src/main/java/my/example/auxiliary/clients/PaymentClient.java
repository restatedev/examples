package my.example.auxiliary.clients;

import my.example.auxiliary.types.PaymentRequest;
import java.util.UUID;

public class PaymentClient {
    public static String createRecurringPayment(String s, String paymentId) {
        return "";
    }

    public static void removeRecurringPayment(String paymentId) {
    }

    public static String initPayment(PaymentRequest req, String paymentId) {
        System.out.printf(">>> Initiating external payment %s \n" +
            "  Confirm the payment via: \n" +
            "  curl localhost:8080/PaymentsWithTimeout/confirm --json '{\"id\": \"%s\", \"result\": {\"success\": true, \"transactionId\": \"txn-123\"}}'\n",
            paymentId, paymentId);
        return "payRef-" + UUID.randomUUID();
    }

    public static void cancelPayment(String payRef) {
        System.out.printf(">>> Canceling external payment with ref %s\n", payRef);
    }
}
