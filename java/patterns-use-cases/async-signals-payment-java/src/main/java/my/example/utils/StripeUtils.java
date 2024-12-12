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

import com.stripe.StripeClient;
import com.stripe.exception.SignatureVerificationException;
import com.stripe.exception.StripeException;
import com.stripe.model.Event;
import com.stripe.model.EventDataObjectDeserializer;
import com.stripe.model.PaymentIntent;
import com.stripe.net.RequestOptions;
import com.stripe.net.Webhook;
import com.stripe.param.PaymentIntentCreateParams;
import com.stripe.param.PaymentIntentCreateParams.ConfirmationMethod;
import dev.restate.sdk.common.TerminalException;
import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;

public class StripeUtils {

  Logger logger = LogManager.getLogger(StripeUtils.class);
  private final String stripeSecretKey = "sk_test_...";
  private final String webhookSecret = "whsec_...";
  private final StripeClient stripe;

  public StripeUtils() {
    stripe = StripeClient.builder().setApiKey(stripeSecretKey).build();
  }

  public PaymentIntent createPaymentIntent(
      String paymentMethodId,
      Long amount,
      String idempotencyKey,
      String webhookPromiseId,
      boolean delayedStatus) {

    try {
      PaymentIntent paymentIntent =
          stripe
              .paymentIntents()
              .create(
                  new PaymentIntentCreateParams.Builder()
                      .setPaymentMethod(paymentMethodId)
                      .setAmount(amount)
                      .setCurrency("USD")
                      .setConfirm(true)
                      .setConfirmationMethod(ConfirmationMethod.AUTOMATIC)
                      .setReturnUrl("https://restate.dev/")
                      .putMetadata("restate_callback_id", webhookPromiseId)
                      .build(),
                  RequestOptions.builder().setIdempotencyKey(idempotencyKey).build());

      if (delayedStatus) {
        paymentIntent.setStatus("processing");
      }

      return paymentIntent;
    } catch (StripeException err) {
      logger.error("Payment error: " + err.getMessage());
      // Simulate delayed notifications for testing
      try {
        PaymentIntent paymentIntent = err.getStripeError().getPaymentIntent();
        if (delayedStatus) {
          paymentIntent.setStatus("processing");
          return paymentIntent;
        } else {
          throw new TerminalException(
              "Payment declined: " + paymentIntent.getStatus() + " - " + err.getMessage());
        }
      } catch (NullPointerException exc) {
        throw new TerminalException("Payment error: " + exc.getMessage());
      }
    }
  }

  public Event parseWebhookCall(byte[] request, String sig) {
    try {
      return Webhook.constructEvent(new String(request), sig, webhookSecret);
    } catch (SignatureVerificationException e) {
      throw new TerminalException(400, "Invalid Stripe signature");
    }
  }

  public PaymentIntent parseAsPaymentIntent(Event event) {
    EventDataObjectDeserializer dataObjectDeserializer = event.getDataObjectDeserializer();
    PaymentIntent paymentIntent = null;
    if (dataObjectDeserializer.getObject().isPresent()) {
      paymentIntent = (PaymentIntent) dataObjectDeserializer.getObject().get();
    } else {
      throw new TerminalException(500, "No Stripe object found in event");
    }

    return paymentIntent;
  }
}
