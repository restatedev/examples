/*
 * Copyright (c) 2024 - Restate Software, Inc., Restate GmbH
 *
 * This file is part of the Tour of Restate Java,
 * which is released under the MIT license.
 *
 * You can find a copy of the license in the file LICENSE
 * in the root directory of this repository or package or at
 * https://github.com/restatedev/examples/
 */

package dev.restate.tour.part3;

import com.google.protobuf.BoolValue;
import dev.restate.sdk.RestateContext;
import dev.restate.sdk.common.CoreSerdes;
import dev.restate.sdk.common.TerminalException;
import dev.restate.tour.auxiliary.EmailClient;
import dev.restate.tour.auxiliary.PaymentClient;
import dev.restate.tour.generated.CheckoutRestate;
import dev.restate.tour.generated.Tour.CheckoutFlowRequest;

import java.time.Duration;
import java.util.UUID;

public class Checkout extends CheckoutRestate.CheckoutRestateImplBase {

    PaymentClient paymentClient = PaymentClient.get();
    EmailClient emailClient = EmailClient.get();

    @Override
    public BoolValue checkout(RestateContext ctx, CheckoutFlowRequest request) throws TerminalException {
        // Generate idempotency key for the stripe client
        var idempotencyKey = ctx.sideEffect(CoreSerdes.STRING_UTF8, () -> UUID.randomUUID().toString());

        // We are a uniform shop where everything costs 40 USD
        var totalPrice = request.getTicketsList().size() * 40.0;

        boolean success = ctx.sideEffect(CoreSerdes.BOOLEAN, () -> paymentClient.call(idempotencyKey, totalPrice));

        if (success) {
            ctx.sideEffect(()-> emailClient.notifyUserOfPaymentSuccess(request.getUserId()));
        } else {
            ctx.sideEffect(() -> emailClient.notifyUserOfPaymentFailure(request.getUserId()));
        }

        return BoolValue.of(success);
    }
}
