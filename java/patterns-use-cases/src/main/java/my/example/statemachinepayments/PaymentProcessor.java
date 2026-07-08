package my.example.statemachinepayments;

import static my.example.statemachinepayments.types.PaymentStatus.*;

import dev.restate.sdk.Restate;
import dev.restate.sdk.annotation.Handler;
import dev.restate.sdk.annotation.VirtualObject;
import dev.restate.sdk.common.StateKey;
import java.time.Duration;
import my.example.statemachinepayments.accounts.Account;
import my.example.statemachinepayments.types.*;

/*
 * A service that processes the payment requests.
 *
 * This is implemented as a virtual object to ensure that only one concurrent request can happen
 * per payment-id. Requests are queued and processed sequentially per id.
 *
 * Methods can be called multiple times with the same payment-id, but payment will be executed
 * only once. If a 'cancelPayment' is called for an id, the payment will either be undone, or
 * blocked from being made in the future, depending on whether the cancel call comes before or after
 * the 'makePayment' call.
 */
@VirtualObject
public class PaymentProcessor {

  /** The key under which we store the status. */
  private static final StateKey<PaymentStatus> STATUS = StateKey.of("status", PaymentStatus.class);

  /** The key under which we store the original payment request. */
  private static final StateKey<Payment> PAYMENT = StateKey.of("payment", Payment.class);

  private static final Duration EXPIRY_TIMEOUT = Duration.ofDays(1);

  @Handler
  public Result makePayment(Payment payment) {
    final String paymentId = Restate.key();
    final PaymentStatus status = Restate.state().get(STATUS).orElse(NEW);

    if (status == CANCELLED) {
      return new Result(false, "Payment already cancelled");
    }
    if (status == COMPLETED_SUCCESSFULLY) {
      return new Result(false, "Payment already completed in prior call");
    }

    // Charge the target account
    Result paymentResult =
        Restate.virtualObject(Account.class, payment.getAccountId())
            .withdraw(payment.getAmountCents());

    // Remember only on success, so that on failure (when we didn't charge) the external
    // caller may retry this (with the same payment-id), for the sake of this example
    if (paymentResult.isSuccess()) {
      Restate.state().set(STATUS, COMPLETED_SUCCESSFULLY);
      Restate.state().set(PAYMENT, payment);
      Restate.virtualObjectHandle(PaymentProcessor.class, paymentId)
          .send(PaymentProcessor::expire, EXPIRY_TIMEOUT);
    }

    return paymentResult;
  }

  @Handler
  public void cancelPayment() {
    PaymentStatus status = Restate.state().get(STATUS).orElse(NEW);

    switch (status) {
      case NEW -> {
        // not seen this payment-id before, mark as canceled, in case the cancellation
        // overtook the actual payment request (on the external caller's side)
        Restate.state().set(STATUS, CANCELLED);
        Restate.virtualObjectHandle(PaymentProcessor.class, Restate.key())
            .send(PaymentProcessor::expire, EXPIRY_TIMEOUT);
      }

      case CANCELLED -> {}

      case COMPLETED_SUCCESSFULLY -> {
        // remember this as cancelled
        Restate.state().set(STATUS, CANCELLED);

        // undo the payment
        Payment payment = Restate.state().get(PAYMENT).get();
        Restate.virtualObjectHandle(Account.class, payment.getAccountId())
            .send(Account::deposit, payment.getAmountCents());
      }
    }
  }

  @Handler
  public void expire() {
    Restate.state().clearAll();
  }
}
