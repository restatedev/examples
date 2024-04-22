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

package dev.restate.tour.part1;

import dev.restate.sdk.ObjectContext;
import dev.restate.sdk.annotation.Handler;
import dev.restate.sdk.annotation.VirtualObject;
import dev.restate.tour.app.CheckoutServiceClient;
import dev.restate.tour.auxiliary.CheckoutRequest;

import java.util.HashSet;
import java.util.List;

@VirtualObject
public class CartObject {
    // <start_add_ticket>
    @Handler
    public boolean addTicket(ObjectContext ctx, String ticketId) {
        // withClass highlight-line
        boolean reservationSuccess = TicketObjectClient.fromContext(ctx, ticketId).reserve().await();

        return true;
    }
    // <end_add_ticket>

    // <start_expire_ticket>
    @Handler
    public void expireTicket(ObjectContext ctx, String ticketId) {
        // withClass highlight-line
        TicketObjectClient.fromContext(ctx, ticketId).send().unreserve();
    }
    // <end_expire_ticket>

    // <start_checkout>
    @Handler
    public boolean checkout(ObjectContext ctx) {
        // withClass(1:3) highlight-line
        boolean checkoutSuccess = CheckoutServiceClient.fromContext(ctx)
                .handle(new CheckoutRequest("Mary", new HashSet<>(List.of("456"))))
                .await();

        return checkoutSuccess;
    }
    // <end_checkout>

}
