package my.example.timers;

import static my.example.auxiliary.clients.PaymentClient.cancelPayment;
import static my.example.auxiliary.clients.PaymentClient.initPayment;

import dev.restate.sdk.Restate;
import dev.restate.sdk.annotation.Handler;
import dev.restate.sdk.annotation.Service;
import dev.restate.sdk.common.TimeoutException;
import java.time.Duration;
import my.example.auxiliary.types.ConfirmationRequest;
import my.example.auxiliary.types.PaymentRequest;
import my.example.auxiliary.types.PaymentResult;

@Service
public class PaymentsWithTimeout {

  @Handler
  public PaymentResult process(PaymentRequest req) {
    var confirmation = Restate.awakeable(PaymentResult.class);

    var paymentId = Restate.random().nextUUID().toString();
    String payRef =
        Restate.run("pay", String.class, () -> initPayment(req, paymentId, confirmation.id()));

    try {
      return confirmation.await(Duration.ofSeconds(30));
    } catch (TimeoutException e) {
      Restate.run("cancel-payment", () -> cancelPayment(payRef));
      return new PaymentResult(false, null, "Payment timeout");
    }
  }

  @Handler
  public void confirm(ConfirmationRequest confirmation) {
    Restate.awakeableHandle(confirmation.id()).resolve(PaymentResult.class, confirmation.result());
  }
}
