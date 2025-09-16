package my.example.events;

import static my.example.auxiliary.clients.PaymentClient.initPayment;

import dev.restate.sdk.Context;
import dev.restate.sdk.annotation.Handler;
import dev.restate.sdk.annotation.Service;
import my.example.auxiliary.types.ConfirmationRequest;
import my.example.auxiliary.types.PaymentRequest;
import my.example.auxiliary.types.PaymentResult;

@Service
public class Payments {

  @Handler
  public PaymentResult process(Context ctx, PaymentRequest req) {
    // Create awakeable to wait for webhook payment confirmation
    var confirmation = ctx.awakeable(PaymentResult.class);

    // Initiate payment with external provider (Stripe, PayPal, etc.)
    var paymentId = ctx.random().nextUUID().toString();
    ctx.run(() -> initPayment(req, paymentId, confirmation.id()));

    // Wait for external payment provider to call our webhook
    return confirmation.await();
  }

  // Webhook handler called by external payment provider
  @Handler
  public void confirm(Context ctx, ConfirmationRequest confirmation) {
    // Resolve the awakeable to continue the payment flow
    ctx.awakeableHandle(confirmation.id()).resolve(PaymentResult.class, confirmation.result());
  }
}
