package my.example.statemachinepayments;

import static my.example.statemachinepayments.types.PaymentStatus.*;

import dev.restate.sdk.ObjectContext;
import dev.restate.sdk.annotation.Handler;
import dev.restate.sdk.annotation.VirtualObject;
import dev.restate.sdk.types.StateKey;
import my.example.statemachinepayments.accounts.AccountClient;
import my.example.statemachinepayments.types.*;

import java.time.Duration;

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
  private static final StateKey<PaymentStatus> STATUS =
      StateKey.of("status", PaymentStatus.class);

  /** The key under which we store the original payment request. */
  private static final StateKey<Payment> PAYMENT =
      StateKey.of("payment", Payment.class);

  private static final Duration EXPIRY_TIMEOUT = Duration.ofDays(1);

  @Handler
  public Result makePayment(ObjectContext ctx, Payment payment) {
    final String paymentId = ctx.key();
    final PaymentStatus status = ctx.get(STATUS).orElse(NEW);

    if (status == CANCELLED) {
      return new Result(false, "Payment already cancelled");
    }
    if (status == COMPLETED_SUCCESSFULLY) {
      return new Result(false, "Payment already completed in prior call");
    }

    // Charge the target account
    Result paymentResult =
        AccountClient.fromContext(ctx, payment.getAccountId())
            .withdraw(payment.getAmountCents())
            .await();

    // Remember only on success, so that on failure (when we didn't charge) the external
    // caller may retry this (with the same payment-id), for the sake of this example
    if (paymentResult.isSuccess()) {
      ctx.set(STATUS, COMPLETED_SUCCESSFULLY);
      ctx.set(PAYMENT, payment);
      PaymentProcessorClient.fromContext(ctx, paymentId).send().expire(EXPIRY_TIMEOUT);
    }

    return paymentResult;
  }

  @Handler
  public void cancelPayment(ObjectContext ctx) {
    PaymentStatus status = ctx.get(STATUS).orElse(NEW);

    switch (status) {
      case NEW -> {
        // not seen this payment-id before, mark as canceled, in case the cancellation
        // overtook the actual payment request (on the external caller's side)
        ctx.set(STATUS, CANCELLED);
        PaymentProcessorClient.fromContext(ctx, ctx.key()).send().expire(EXPIRY_TIMEOUT);
      }

      case CANCELLED -> {}

      case COMPLETED_SUCCESSFULLY -> {
        // remember this as cancelled
        ctx.set(STATUS, CANCELLED);

        // undo the payment
        Payment payment = ctx.get(PAYMENT).get();
        AccountClient.fromContext(ctx, payment.getAccountId())
            .send()
            .deposit(payment.getAmountCents());
      }
    }
  }

  @Handler
  public void expire(ObjectContext ctx) {
    ctx.clearAll();
  }
}
