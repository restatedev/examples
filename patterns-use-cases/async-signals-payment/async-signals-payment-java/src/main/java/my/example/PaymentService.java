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

package my.example;

import com.stripe.model.Event;
import com.stripe.model.PaymentIntent;
import com.stripe.model.StripeObject;
import dev.restate.sdk.Awakeable;
import dev.restate.sdk.Context;
import dev.restate.sdk.annotation.Handler;
import dev.restate.sdk.annotation.Service;
import dev.restate.sdk.common.Request;
import dev.restate.sdk.common.TerminalException;
import dev.restate.sdk.http.vertx.RestateHttpEndpointBuilder;
import dev.restate.sdk.serde.jackson.JacksonSerdes;
import my.example.types.PaymentRequest;
import my.example.utils.PaymentUtils;
import my.example.utils.StripeUtils;
import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;

import java.util.Optional;

//
// The payment handlers that issues calls to Stripe.
//  - the result often comes synchronously as a response API call.
//  - some requests (and some payment methods) only return "processing" and
//    notify later via a webhook.
//
// This example combines both paths in a single function that reliably waits for both
// paths, if needed, thus giving you a single long-running synchronous function.
// Durable execution and the persistent awakeable promises combine this into a single
// reliably promise/async-function.
//
// See README on how to run this example (needs a Stripe test account).
//
@Service
public class PaymentService {

  private static final Logger logger = LogManager.getLogger(PaymentService.class);
  private static final StripeUtils stripe = new StripeUtils();


  @Handler
  public void processPayment(Context ctx, PaymentRequest request) {
    PaymentUtils.verifyPaymentRequest(request);

    // Generate a deterministic idempotency key
    String idempotencyKey = ctx.random().nextUUID().toString();

    // Initiate a listener for external calls for potential webhook callbacks
    Awakeable<PaymentIntent> webhookPromise = ctx.awakeable(JacksonSerdes.of(PaymentIntent.class));

    // Make a synchronous call to the payment service
    PaymentIntent paymentIntent = ctx.run(
          "Stripe call",
          JacksonSerdes.of(PaymentIntent.class),
            () -> {
                // create payment intent
                return stripe.createPaymentIntent(
                        request.getPaymentMethodId(),
                        request.getAmount(),
                        idempotencyKey,
                        webhookPromise.id(),
                        request.isDelayed()
                );
    });

    if(!paymentIntent.getStatus().equals("processing")){
      // The synchronous call to Stripe had already been completed.
      // That was fast :)
      logger.info("Request {} was processed synchronously!", idempotencyKey);
      PaymentUtils.ensureSuccess(paymentIntent.getStatus());
    }

    // We did not get the response on the synchronous path, talking to Stripe.
    // No worries, Stripe will let us know when it is done processing via a webhook.
    logger.info(
            "Synchronous response for {} yielded 'processing', awaiting webhook call...",
            idempotencyKey
    );

    // We will now wait for the webhook call to complete this promise.
    // Check out the handler below.
    PaymentIntent processedPaymentIntent = webhookPromise.await();

    logger.info("Received webhook call for idempotency key: {}", idempotencyKey);
    PaymentUtils.ensureSuccess(processedPaymentIntent.getStatus());
  }


  @Handler
  public boolean processWebhook(Context ctx){
    Request req = ctx.request();
    String sig = req.headers().get("stripe-signature");
    Event event = stripe.parseWebhookCall(req.body(), sig);

    if(!PaymentUtils.isPaymentIntent(event)){
      logger.info("Unhandled event type: {}", event.getType());
      return true;
    }

    Optional<StripeObject> stripeObject = event.getDataObjectDeserializer().getObject();

    if(stripeObject.isEmpty()){
      logger.info("No Stripe object found in event");
      return true;
    }

    PaymentIntent paymentIntent = (PaymentIntent) stripeObject.get();
    logger.info(paymentIntent.toJson());

    String webhookPromise = paymentIntent.getMetadata().get(PaymentUtils.RESTATE_CALLBACK_ID);

    if(webhookPromise == null){
      throw new TerminalException(404, "Missing callback property: " + PaymentUtils.RESTATE_CALLBACK_ID);
    }

    ctx.awakeableHandle(webhookPromise)
            .resolve(JacksonSerdes.of(PaymentIntent.class), paymentIntent);
    return true;
  }

  public static void main(String[] args) {
    RestateHttpEndpointBuilder.builder()
            .bind(new PaymentService())
            .buildAndListen();
  }
}
