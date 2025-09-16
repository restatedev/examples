package my.example.timers;

import static my.example.auxiliary.clients.PaymentClient.cancelPayment;
import static my.example.auxiliary.clients.PaymentClient.initPayment;

import dev.restate.sdk.Context;
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
  public PaymentResult process(Context ctx, PaymentRequest req) {
    var confirmation = ctx.awakeable(PaymentResult.class);

    var paymentId = ctx.random().nextUUID().toString();
    String payRef =
        ctx.run("pay", String.class, () -> initPayment(req, paymentId, confirmation.id()));

    try {
      return confirmation.await(Duration.ofSeconds(30));
    } catch (TimeoutException e) {
      ctx.run("cancel-payment", () -> cancelPayment(payRef));
      return new PaymentResult(false, null, "Payment timeout");
    }
  }

  @Handler
  public void confirm(Context ctx, ConfirmationRequest confirmation) {
    ctx.awakeableHandle(confirmation.id()).resolve(PaymentResult.class, confirmation.result());
  }
}
