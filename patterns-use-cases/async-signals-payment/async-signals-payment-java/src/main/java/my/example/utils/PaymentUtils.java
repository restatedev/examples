/*
 * Copyright (c) 2024 - Restate Software, Inc., Restate GmbH
 *
 * This file is part of the Restate examples,
 * which is released under the MIT license.
 *
 * You can find a copy of the license in the file LICENSE
 * in the root directory of this repository or package or at
 * https://github.com/restatedev/examples/
 */

package my.example.utils;

import com.stripe.model.Event;
import dev.restate.sdk.common.TerminalException;
import my.example.types.PaymentRequest;

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

  public static void verifyPaymentRequest(PaymentRequest request) {
    if (request.getAmount() <= 0) {
      throw new TerminalException("Amount must be larger than zero");
    }
    if (request.getPaymentMethodId() == null) {
      throw new TerminalException("Payment method ID missing in request");
    }
  }
}
