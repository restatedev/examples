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
import dev.restate.sdk.annotation.Service;
import dev.restate.tour.auxiliary.CheckoutRequest;

import java.time.Duration;
import java.util.HashSet;
import java.util.List;

@Service
public class CartObject {
    // <start_add_ticket>
    @Handler
    public boolean addTicket(ObjectContext ctx, String ticketId) {

        boolean reservationSuccess = TicketObjectClient.fromContext(ctx).reserve().await();

        if (reservationSuccess) {
            // withClass highlight-line
            CartObjectClient.fromContext(ctx)
                    // withClass highlight-line
                    .send(Duration.ofMinutes(15))
                    // withClass highlight-line
                    .expireTicket(ticketId);
        }

        return reservationSuccess;
    }
    // <end_add_ticket>

    @Handler
    public void expireTicket(ObjectContext ctx, String ticketId) {
        TicketObjectClient.fromContext(ctx).send().unreserve();
    }

    @Handler
    public boolean checkout(ObjectContext ctx) {
        boolean checkoutSuccess = CheckoutServiceClient.fromContext(ctx)
                .handle(new CheckoutRequest(ctx.key(), new HashSet<>(List.of("456"))))
                .await();

        return checkoutSuccess;
    }

}
