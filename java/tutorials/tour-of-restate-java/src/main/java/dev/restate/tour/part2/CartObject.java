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

package dev.restate.tour.part2;

import dev.restate.sdk.ObjectContext;
import dev.restate.sdk.annotation.Handler;
import dev.restate.sdk.annotation.VirtualObject;
import dev.restate.tour.auxiliary.CheckoutRequest;

import java.time.Duration;
import java.util.Set;

@VirtualObject
public class CartObject {
    // <start_add_ticket>
    @Handler
    public boolean addTicket(ObjectContext ctx, String ticketId) {

        boolean reservationSuccess = TicketObjectClient.fromContext(ctx, ticketId).reserve().await();

        if (reservationSuccess) {
            // !mark(1:3)
            CartObjectClient.fromContext(ctx, ctx.key())
                    .send()
                    .expireTicket(ticketId, Duration.ofMinutes(15));
        }

        return reservationSuccess;
    }
    // <end_add_ticket>

    @Handler
    public void expireTicket(ObjectContext ctx, String ticketId) {
        TicketObjectClient.fromContext(ctx, ticketId).send().unreserve();
    }

    @Handler
    public boolean checkout(ObjectContext ctx) {
        boolean checkoutSuccess = CheckoutServiceClient.fromContext(ctx)
                .handle(new CheckoutRequest("Mary", Set.of("seat2B")))
                .await();

        return checkoutSuccess;
    }

}
