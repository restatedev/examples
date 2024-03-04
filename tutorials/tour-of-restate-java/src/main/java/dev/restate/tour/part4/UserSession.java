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

import com.fasterxml.jackson.core.type.TypeReference;
import com.google.protobuf.BoolValue;
import dev.restate.sdk.ObjectContext;
import dev.restate.sdk.common.StateKey;
import dev.restate.sdk.common.TerminalException;
import dev.restate.sdk.serde.jackson.JacksonSerdes;
import dev.restate.tour.generated.CheckoutRestate;
import dev.restate.tour.generated.TicketServiceRestate;
import dev.restate.tour.generated.Tour.*;
import dev.restate.tour.generated.UserSessionRestate;

import java.time.Duration;
import java.util.HashSet;
import java.util.Set;

public class UserSession extends UserSessionRestate.UserSessionRestateImplBase {

    public static final StateKey<Set<String>> STATE_KEY = StateKey.of("tickets", JacksonSerdes.of(new TypeReference<>() {}));

    @Override
    public BoolValue addTicket(ObjectContext ctx, ReserveTicket request) throws TerminalException {
        var ticketClnt = TicketServiceRestate.newClient(ctx);
        var reservationSuccess = ticketClnt
                .reserve(Ticket.newBuilder().setTicketId(request.getTicketId()).build())
                .await();

        if (reservationSuccess.getValue()) {
            var tickets = ctx.get(STATE_KEY).orElseGet(HashSet::new);
            tickets.add(request.getTicketId());
            ctx.set(STATE_KEY, tickets);

            var userSessionClnt = UserSessionRestate.newClient(ctx);
            userSessionClnt.delayed(Duration.ofMinutes(15)).expireTicket(
                ExpireTicketRequest.newBuilder().setTicketId(request.getTicketId()).setUserId(request.getUserId()).build()
            );
        }

        return reservationSuccess;
    }

    @Override
    public void expireTicket(ObjectContext ctx, ExpireTicketRequest request) throws TerminalException {
        var tickets = ctx.get(STATE_KEY).orElseGet(HashSet::new);

        var removed = tickets.removeIf(s -> s.equals(request.getTicketId()));

        if (removed) {
            ctx.set(STATE_KEY, tickets);
            var ticketClnt = TicketServiceRestate.newClient(ctx);
            ticketClnt.oneWay().unreserve(Ticket.newBuilder().setTicketId(request.getTicketId()).build());
        }
    }

    @Override
    public BoolValue checkout(ObjectContext ctx, CheckoutRequest request) throws TerminalException {
        var tickets = ctx.get(STATE_KEY).orElseGet(HashSet::new);

        if (tickets.isEmpty()) {
            return BoolValue.of(false);
        }

        var checkoutClnt = CheckoutRestate.newClient(ctx);
        var checkoutSuccess = checkoutClnt.checkout(
            CheckoutFlowRequest.newBuilder().setUserId(request.getUserId()).addAllTickets(tickets).build()
        ).await();

        if (checkoutSuccess.getValue()) {
            var ticketClnt = TicketServiceRestate.newClient(ctx);
            tickets.forEach(t -> ticketClnt.oneWay().markAsSold(Ticket.newBuilder().setTicketId(t).build()));
            ctx.clear(STATE_KEY);
        }

        return checkoutSuccess;
    }
}
