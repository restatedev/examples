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
import dev.restate.tour.app.CheckoutClient;
import dev.restate.tour.auxiliary.CheckoutRequest;
import dev.restate.tour.part5.TicketServiceClient;

import java.util.HashSet;
import java.util.List;

@VirtualObject
public class UserSession {
    // <start_add_ticket>
    @Handler
    public boolean addTicket(ObjectContext ctx, String ticketId) {

        //highlight-start
        boolean reservationSuccess = TicketServiceClient.fromContext(ctx, ticketId).reserve().await();
        //highlight-end

        return true;
    }
    // <end_add_ticket>

    // <start_expire_ticket>
    @Handler
    public void expireTicket(ObjectContext ctx, String ticketId) {
        //highlight-start
        TicketServiceClient.fromContext(ctx, ticketId).send().unreserve();
        //highlight-end
    }
    // <end_expire_ticket>

    // <start_checkout>
    @Handler
    public boolean checkout(ObjectContext ctx) {
        //highlight-start
        boolean checkoutSuccess = CheckoutClient.fromContext(ctx)
                .handle(new CheckoutRequest(ctx.key(), new HashSet<>(List.of("456"))))
                .await();
        //highlight-end

        return checkoutSuccess;
    }
    // <end_checkout>

}
