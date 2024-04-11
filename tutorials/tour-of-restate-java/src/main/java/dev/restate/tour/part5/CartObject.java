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

import com.fasterxml.jackson.core.type.TypeReference;
import dev.restate.sdk.ObjectContext;
import dev.restate.sdk.annotation.Handler;
import dev.restate.sdk.annotation.VirtualObject;
import dev.restate.sdk.common.StateKey;
import dev.restate.sdk.serde.jackson.JacksonSerdes;
import dev.restate.tour.auxiliary.CheckoutRequest;

import java.time.Duration;
import java.util.HashSet;
import java.util.Set;

@VirtualObject
public class CartObject {

    public static final StateKey<Set<String>> STATE_KEY = StateKey.of("tickets", JacksonSerdes.of(new TypeReference<>() {}));

    @Handler
    public boolean addTicket(ObjectContext ctx, String ticketId) {

        boolean reservationSuccess = TicketObjectClient.fromContext(ctx, ticketId).reserve().await();

        if (reservationSuccess) {
            Set<String> tickets = ctx.get(STATE_KEY).orElseGet(HashSet::new);
            tickets.add(ticketId);
            ctx.set(STATE_KEY, tickets);

            CartObjectClient.fromContext(ctx, ctx.key())
                .send(Duration.ofMinutes(15))
                .expireTicket(ticketId);
        }

        return reservationSuccess;
    }

    @Handler
    public void expireTicket(ObjectContext ctx, String ticketId) {
        Set<String> tickets = ctx.get(STATE_KEY).orElseGet(HashSet::new);

        boolean removed = tickets.removeIf(s -> s.equals(ticketId));

        if (removed) {
            ctx.set(STATE_KEY, tickets);
            TicketObjectClient.fromContext(ctx, ticketId).send().unreserve();
        }
    }

    @Handler
    public boolean checkout(ObjectContext ctx) {
        Set<String> tickets = ctx.get(STATE_KEY).orElseGet(HashSet::new);

        if (tickets.isEmpty()) {
            return false;
        }

        boolean checkoutSuccess = CheckoutServiceClient.fromContext(ctx)
                .handle(new CheckoutRequest(ctx.key(), tickets))
                .await();

        if (checkoutSuccess) {
            tickets.forEach(t ->
                TicketObjectClient.fromContext(ctx, t).send().markAsSold()
            );
            ctx.clear(STATE_KEY);
        }

        return checkoutSuccess;
    }
}
