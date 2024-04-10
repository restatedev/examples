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

import dev.restate.sdk.Context;
import dev.restate.sdk.annotation.Handler;
import dev.restate.sdk.annotation.Service;
import dev.restate.sdk.common.CoreSerdes;
import dev.restate.tour.auxiliary.CheckoutRequest;
import dev.restate.tour.auxiliary.EmailClient;
import dev.restate.tour.auxiliary.PaymentClient;

@Service
public class Checkout {

    @Handler
    public boolean handle(Context ctx, CheckoutRequest request) {
        double totalPrice = request.getTickets().size() * 40.0;

        String idempotencyKey = ctx.random().nextUUID().toString();
        // <start_failing_client>
        boolean success = ctx.run(CoreSerdes.JSON_BOOLEAN, () -> PaymentClient.get().failingCall(idempotencyKey, totalPrice));
        // <end_failing_client>

        if (success) {
            ctx.run(CoreSerdes.JSON_BOOLEAN, ()-> EmailClient.get().notifyUserOfPaymentSuccess(request.getUserId()));
        } else {
            ctx.run(CoreSerdes.JSON_BOOLEAN, () -> EmailClient.get().notifyUserOfPaymentFailure(request.getUserId()));
        }

        return success;
    }
}
