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

import dev.restate.sdk.JsonSerdes;
import dev.restate.sdk.Context;
import dev.restate.sdk.annotation.Handler;
import dev.restate.sdk.annotation.Service;
import dev.restate.tour.auxiliary.CheckoutRequest;
import dev.restate.tour.auxiliary.EmailClient;
import dev.restate.tour.auxiliary.PaymentClient;

@Service
public class CheckoutService {
    // <start_checkout>
    @Handler
    public boolean handle(Context ctx, CheckoutRequest request) {
        double totalPrice = request.getTickets().size() * 40.0;

        String idempotencyKey = ctx.random().nextUUID().toString();
        boolean success = ctx.run(JsonSerdes.BOOLEAN, () ->
                PaymentClient.get().call(idempotencyKey, totalPrice));

        if (success) {
            ctx.run(()-> EmailClient.get().notifyUserOfPaymentSuccess(request.getUserId()));
        } else {
            ctx.run(() -> EmailClient.get().notifyUserOfPaymentFailure(request.getUserId()));
        }

        return success;
    }
    // <end_checkout>
}
