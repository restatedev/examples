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

package dev.restate.tour.part4;

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

    // <start_checkout>
    @Override
    public BoolValue handle(Context ctx, CheckoutFlowRequest request) throws TerminalException {
        // <start_side_effects>
        double totalPrice = request.getTicketsList().size() * 40.0;

        String idempotencyKey = ctx.random().nextUUID().toString();
        boolean success = ctx.sideEffect(CoreSerdes.JSON_BOOLEAN, () -> PaymentClient.get().call(idempotencyKey, totalPrice));
        // <end_side_effects>

        if (success) {
            ctx.sideEffect(()-> EmailClient.get().notifyUserOfPaymentSuccess(request.getUserId()));
        } else {
            ctx.sideEffect(() -> EmailClient.get().notifyUserOfPaymentFailure(request.getUserId()));
        }

        return BoolValue.of(success);
    }
    // <end_checkout>
}
