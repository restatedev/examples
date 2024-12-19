package my.example.signalspayments.utils;

import com.stripe.model.Event;
import dev.restate.sdk.common.TerminalException;
import my.example.signalspayments.PaymentService;

public class PaymentUtils {

  public static final String RESTATE_CALLBACK_ID = "restate_callback_id";

  public static void ensureSuccess(String status) {
    switch (status) {
      case "succeeded" -> {}
      case "requires_payment_method", "canceled" ->
          throw new TerminalException("Payment declined" + status);
      default -> {
        throw new IllegalStateException("Unhandled status: " + status);
      }
    }
  }

  public static boolean isPaymentIntent(Event event) {
    return event.getType().startsWith("payment_intent");
  }

  public static void verifyPaymentRequest(PaymentService.PaymentRequest request) {
    if (request.amount() <= 0) {
      throw new TerminalException("Amount must be larger than zero");
    }
    if (request.paymentMethodId() == null) {
      throw new TerminalException("Payment method ID missing in request");
    }
  }
}
