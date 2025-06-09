package my.example.signalspayments;

import com.stripe.model.Event;
import com.stripe.model.PaymentIntent;
import com.stripe.net.ApiResource;
import dev.restate.sdk.Awakeable;
import dev.restate.sdk.Context;
import dev.restate.sdk.annotation.Accept;
import dev.restate.sdk.annotation.Handler;
import dev.restate.sdk.annotation.Raw;
import dev.restate.sdk.annotation.Service;
import dev.restate.sdk.common.TerminalException;
import dev.restate.sdk.endpoint.Endpoint;
import dev.restate.sdk.http.vertx.RestateHttpServer;
import dev.restate.serde.Serde;
import my.example.signalspayments.utils.PaymentUtils;
import my.example.signalspayments.utils.StripeUtils;
import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;

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

  private static final Serde<PaymentIntent> paymentIntentSerde =
      Serde.using(
          intent -> intent.toJson().getBytes(),
          bytes -> ApiResource.GSON.fromJson(new String(bytes), PaymentIntent.class));

  public record PaymentRequest(Long amount, String paymentMethodId, boolean delayedStatus) {}

  @Handler
  public void processPayment(Context ctx, PaymentRequest request) {
    PaymentUtils.verifyPaymentRequest(request);

    // Generate a deterministic idempotency key
    String idempotencyKey = ctx.random().nextUUID().toString();

    // Initiate a listener for external calls for potential webhook callbacks
    Awakeable<PaymentIntent> webhookPromise = ctx.awakeable(paymentIntentSerde);

    // Make a synchronous call to the payment service
    PaymentIntent paymentIntent =
        ctx.run(
            "Stripe call",
            paymentIntentSerde,
            () -> {
              // create payment intent
              return stripe.createPaymentIntent(
                  request.paymentMethodId(),
                  request.amount(),
                  idempotencyKey,
                  webhookPromise.id(),
                  request.delayedStatus());
            });

    if (!paymentIntent.getStatus().equals("processing")) {
      // The synchronous call to Stripe had already been completed.
      // That was fast :)
      logger.info("Request {} was processed synchronously!", idempotencyKey);
      PaymentUtils.ensureSuccess(paymentIntent.getStatus());
    }

    // We did not get the response on the synchronous path, talking to Stripe.
    // No worries, Stripe will let us know when it is done processing via a webhook.
    logger.info(
        "Payment intent for {} still 'processing', awaiting webhook call...", idempotencyKey);

    // We will now wait for the webhook call to complete this promise.
    // Check out the handler below.
    PaymentIntent processedPaymentIntent = webhookPromise.await();

    logger.info("Received webhook call for idempotency key: {}", idempotencyKey);
    PaymentUtils.ensureSuccess(processedPaymentIntent.getStatus());
  }

  @Handler
  public boolean processWebhook(
      Context ctx,
      // The raw request is the webhook call from Stripe that we will verify in the handler
      @Accept("*/*") @Raw byte[] request) {
    Event event = stripe.parseWebhookCall(request, ctx.request().headers().get("stripe-signature"));

    if (!PaymentUtils.isPaymentIntent(event)) {
      logger.info("Unhandled event type: {}", event.getType());
      return true;
    }

    PaymentIntent paymentIntent = stripe.parseAsPaymentIntent(event);
    logger.info("Received webhook call for payment intent: {}", paymentIntent.toJson());

    String webhookPromise = paymentIntent.getMetadata().get(PaymentUtils.RESTATE_CALLBACK_ID);

    if (webhookPromise == null) {
      throw new TerminalException(
          400, "Missing callback property: " + PaymentUtils.RESTATE_CALLBACK_ID);
    }

    ctx.awakeableHandle(webhookPromise).resolve(paymentIntentSerde, paymentIntent);
    return true;
  }

  public static void main(String[] args) {
    RestateHttpServer.listen(Endpoint.bind(new PaymentService()));
  }
}
