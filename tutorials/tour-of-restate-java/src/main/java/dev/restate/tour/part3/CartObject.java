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

import com.fasterxml.jackson.core.type.TypeReference;
import dev.restate.sdk.ObjectContext;
import dev.restate.sdk.annotation.Handler;
import dev.restate.sdk.annotation.VirtualObject;
import dev.restate.sdk.common.StateKey;
import dev.restate.sdk.serde.jackson.JacksonSerdes;
import dev.restate.tour.app.CheckoutClient;
import dev.restate.tour.app.UserSessionClient;
import dev.restate.tour.auxiliary.CheckoutRequest;
import dev.restate.tour.part5.TicketServiceClient;

import java.time.Duration;
import java.util.HashSet;
import java.util.Set;

@VirtualObject
public class CartObject {

    // <start_add_ticket>
    // At the top of the class, define the state key: supply a name and (de)serializer
    // withClass highlight-line
    public static final StateKey<Set<String>> STATE_KEY = StateKey.of("tickets", JacksonSerdes.of(new TypeReference<>() {}));


    @Handler
    public boolean addTicket(ObjectContext ctx, String ticketId) {
        boolean reservationSuccess = TicketServiceClient.fromContext(ctx, ticketId).reserve().await();

        if (reservationSuccess) {
            // withClass highlight-line
            Set<String> tickets = ctx.get(STATE_KEY).orElseGet(HashSet::new);
            tickets.add(ticketId);
            // withClass highlight-line
            ctx.set(STATE_KEY, tickets);

            UserSessionClient.fromContext(ctx, ctx.key())
                    .send(Duration.ofMinutes(15))
                    .expireTicket(ticketId);
        }

        return reservationSuccess;
    }
    // <end_add_ticket>

    // <start_expire_ticket>
    @Handler
    public void expireTicket(ObjectContext ctx, String ticketId) {
        Set<String> tickets = ctx.get(STATE_KEY).orElseGet(HashSet::new);

        boolean removed = tickets.removeIf(s -> s.equals(ticketId));

        if (removed) {
            ctx.set(STATE_KEY, tickets);
            TicketServiceClient.fromContext(ctx, ticketId).send().unreserve();
        }
    }
    // <end_expire_ticket>

    // <start_checkout>
    @Handler
    public boolean checkout(ObjectContext ctx) {
        // withClass highlight-line
        Set<String> tickets = ctx.get(STATE_KEY).orElseGet(HashSet::new);

        // withClass highlight-line
        if (tickets.isEmpty()) {
            // withClass highlight-line
            return false;
        // withClass highlight-line
        }

        boolean checkoutSuccess = CheckoutClient.fromContext(ctx)
                .handle(new CheckoutRequest(ctx.key(), tickets))
                .await();

        if (checkoutSuccess) {
            // withClass highlight-line
            ctx.clear(STATE_KEY);
        }

        return checkoutSuccess;
    }
    // <end_checkout>

}
