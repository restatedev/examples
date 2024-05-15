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

import dev.restate.sdk.ObjectContext;
import dev.restate.sdk.annotation.Handler;
import dev.restate.sdk.annotation.VirtualObject;
import dev.restate.sdk.common.StateKey;
import dev.restate.sdk.common.TerminalException;
import dev.restate.sdk.serde.jackson.JacksonSerdes;
import java.time.Duration;
import my.example.accounts.AccountClient;
import my.example.types.Payment;
import my.example.types.PaymentStatus;
import my.example.types.Result;

/**
 * The service that processes the payment requests.
 *
 * <p>This is implemented as a virtual object to ensure that only one concurrent request can happen
 * per token (requests are queued and processed sequentially per token).
 *
 * <p>Note that this idempotency-token is more of an operation/payment-id. Methods can be called
 * multiple times with the same token, but payment will be executed only once. Also, if a
 * cancellation is triggered for that token, the payment will not happen or be undine, regardless of
 * whether the cancel call comes before or after the payment call.
 */
@VirtualObject
public class PaymentProcessor {

  private static final Duration EXPIRY_TIMEOUT = Duration.ofHours(1);

  private static final StateKey<PaymentStatus> STATUS =
      StateKey.of("status", JacksonSerdes.of(PaymentStatus.class));
  private static final StateKey<Payment> PAYMENT =
      StateKey.of("payment", JacksonSerdes.of(Payment.class));

  @Handler
  public Result makePayment(ObjectContext ctx, Payment payment) {
    // De-duplication to make calls idempotent
    PaymentStatus status = ctx.get(STATUS).orElse(PaymentStatus.NEW);
    if (status == PaymentStatus.CANCELLED) {
      return new Result(false, "Payment already cancelled");
    }

    if (status == PaymentStatus.COMPLETED_SUCCESSFULLY) {
      return new Result(false, "Payment already completed in prior call");
    }

    // Charge the target account
    Result paymentResult =
        AccountClient.fromContext(ctx, payment.getAccountId())
            .withdraw(payment.getAmountCents())
            .await();

    // Remember only on success, so that on failure (when we didn't charge) the external
    // caller may retry this (with the same token), for the sake of this example
    if (paymentResult.isSuccess()) {
      ctx.set(STATUS, PaymentStatus.COMPLETED_SUCCESSFULLY);
      ctx.set(PAYMENT, payment);

      String idempotencyToken = ctx.key();
      PaymentProcessorClient.fromContext(ctx, idempotencyToken)
          .send(EXPIRY_TIMEOUT)
          .expireToken();
    }

    return paymentResult;
  }

  @Handler
  public void cancelPayment(ObjectContext ctx) {
    PaymentStatus status = ctx.get(STATUS).orElse(PaymentStatus.NEW);

    switch (status) {
      case NEW -> {
        // not seen this token before, mark as canceled, in case the cancellation
        // overtook the actual payment request (on the external caller's side)
        ctx.set(STATUS, PaymentStatus.CANCELLED);

        // cancel the scheduled expiry
        PaymentProcessorClient.fromContext(ctx, ctx.key())
            .send(EXPIRY_TIMEOUT)
            .expireToken();
      }
      case CANCELLED -> {
        // already cancelled, this is a repeated request
      }
      case COMPLETED_SUCCESSFULLY -> {
        // remember this as cancelled
        ctx.set(STATUS, PaymentStatus.CANCELLED);

        // undo the payment
        Payment payment =
            ctx.get(PAYMENT).orElseThrow(() -> new TerminalException("Payment not found"));
        AccountClient.fromContext(ctx, payment.getAccountId())
            .send()
            .deposit(payment.getAmountCents());
      }
    }
  }

  @Handler
  public void expireToken(ObjectContext ctx) {
    ctx.clear(STATUS);
    ctx.clear(PAYMENT);
  }
}
