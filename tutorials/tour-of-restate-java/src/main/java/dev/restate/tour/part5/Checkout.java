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

package dev.restate.tour.part5;

import com.google.protobuf.BoolValue;
import dev.restate.sdk.Context;
import dev.restate.sdk.common.CoreSerdes;
import dev.restate.sdk.common.TerminalException;
import dev.restate.tour.auxiliary.EmailClient;
import dev.restate.tour.auxiliary.PaymentClient;
import dev.restate.tour.generated.CheckoutRestate;
import dev.restate.tour.generated.Tour.CheckoutFlowRequest;

import java.util.UUID;

public class Checkout extends CheckoutRestate.CheckoutRestateImplBase {

    @Override
    public BoolValue checkout(Context ctx, CheckoutFlowRequest request) throws TerminalException {
        double totalPrice = request.getTicketsList().size() * 40.0;

        String idempotencyKey = ctx.random().nextUUID().toString();
        // <start_failing_client>
        boolean success = ctx.sideEffect(CoreSerdes.JSON_BOOLEAN, () -> PaymentClient.get().failingCall(idempotencyKey, totalPrice));
        // <end_failing_client>

        if (success) {
            ctx.sideEffect(CoreSerdes.JSON_BOOLEAN, ()-> EmailClient.get().notifyUserOfPaymentSuccess(request.getUserId()));
        } else {
            ctx.sideEffect(CoreSerdes.JSON_BOOLEAN, () -> EmailClient.get().notifyUserOfPaymentFailure(request.getUserId()));
        }

        return BoolValue.of(success);
    }
}
