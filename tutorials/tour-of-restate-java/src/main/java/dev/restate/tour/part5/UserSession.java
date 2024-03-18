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
import com.google.protobuf.BoolValue;
import dev.restate.sdk.ObjectContext;
import dev.restate.sdk.common.StateKey;
import dev.restate.sdk.common.TerminalException;
import dev.restate.sdk.serde.jackson.JacksonSerdes;
import dev.restate.tour.generated.CheckoutRestate;
import dev.restate.tour.generated.TicketServiceRestate;
import dev.restate.tour.generated.Tour.*;
import dev.restate.tour.generated.UserSessionRestate;
import static dev.restate.tour.generated.TicketServiceRestate.*;
import static dev.restate.tour.generated.CheckoutRestate.*;
import java.time.Duration;
import java.util.HashSet;
import java.util.Set;

public class UserSession extends UserSessionRestate.UserSessionRestateImplBase {

    public static final StateKey<Set<String>> STATE_KEY = StateKey.of("tickets", JacksonSerdes.of(new TypeReference<>() {}));

    @Override
    public BoolValue addTicket(ObjectContext ctx, ReserveTicket request) throws TerminalException {
        Ticket ticket = Ticket.newBuilder().setTicketId(request.getTicketId()).build();
        TicketServiceRestateClient ticketClnt = TicketServiceRestate.newClient(ctx);
        BoolValue reservationSuccess = ticketClnt.reserve(ticket).await() ;

        if (reservationSuccess.getValue()) {
            Set<String> tickets = ctx.get(STATE_KEY).orElseGet(HashSet::new);
            tickets.add(request.getTicketId());
            ctx.set(STATE_KEY, tickets);

            ExpireTicketRequest expirationRequest =
                    ExpireTicketRequest.newBuilder().setTicketId(request.getTicketId()).setUserId(request.getUserId()).build();
            UserSessionRestate.UserSessionRestateClient userSessionClnt = UserSessionRestate.newClient(ctx);
            userSessionClnt.delayed(Duration.ofMinutes(15)).expireTicket(expirationRequest);
        }

        return reservationSuccess;
    }

    @Override
    public void expireTicket(ObjectContext ctx, ExpireTicketRequest request) throws TerminalException {
        Set<String> tickets = ctx.get(STATE_KEY).orElseGet(HashSet::new);

        boolean removed = tickets.removeIf(s -> s.equals(request.getTicketId()));

        if (removed) {
            ctx.set(STATE_KEY, tickets);
            Ticket ticket = Ticket.newBuilder().setTicketId(request.getTicketId()).build();
            TicketServiceRestateClient ticketClnt = TicketServiceRestate.newClient(ctx);
            ticketClnt.oneWay().unreserve(ticket);
        }
    }

    @Override
    public BoolValue checkout(ObjectContext ctx, CheckoutRequest request) throws TerminalException {
        Set<String> tickets = ctx.get(STATE_KEY).orElseGet(HashSet::new);

        if (tickets.isEmpty()) {
            return BoolValue.of(false);
        }

        CheckoutFlowRequest checkoutFlowRequest = CheckoutFlowRequest.newBuilder().setUserId(request.getUserId()).addTickets("456").build();
        CheckoutRestateClient checkoutClnt = CheckoutRestate.newClient(ctx);
        BoolValue checkoutSuccess = checkoutClnt.checkout(checkoutFlowRequest).await();

        if (checkoutSuccess.getValue()) {
            TicketServiceRestateOneWayClient ticketClnt = TicketServiceRestate.newClient(ctx).oneWay();
            tickets.forEach(t -> ticketClnt.markAsSold(Ticket.newBuilder().setTicketId(t).build()));
            ctx.clear(STATE_KEY);
        }

        return checkoutSuccess;
    }
}
