package my.example.events;

import static my.example.auxiliary.clients.PaymentClient.initPayment;

import dev.restate.sdk.Restate;
import dev.restate.sdk.annotation.Handler;
import dev.restate.sdk.annotation.Service;
import my.example.auxiliary.types.ConfirmationRequest;
import my.example.auxiliary.types.PaymentRequest;
import my.example.auxiliary.types.PaymentResult;

@Service
public class Payments {

  @Handler
  public PaymentResult process(PaymentRequest req) {
    // Create awakeable to wait for webhook payment confirmation
    var confirmation = Restate.awakeable(PaymentResult.class);

    // Initiate payment with external provider (Stripe, PayPal, etc.)
    var paymentId = Restate.random().nextUUID().toString();
    Restate.run("pay", () -> initPayment(req, paymentId, confirmation.id()));

    // Wait for external payment provider to call our webhook
    return confirmation.await();
  }

  // Webhook handler called by external payment provider
  @Handler
  public void confirm(ConfirmationRequest confirmation) {
    // Resolve the awakeable to continue the payment flow
    Restate.awakeableHandle(confirmation.id()).resolve(PaymentResult.class, confirmation.result());
  }
}
