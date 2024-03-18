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
import com.google.protobuf.BoolValue;
import dev.restate.sdk.ObjectContext;
import dev.restate.sdk.common.StateKey;
import dev.restate.sdk.common.TerminalException;
import dev.restate.sdk.serde.jackson.JacksonSerdes;
import dev.restate.tour.generated.*;
import dev.restate.tour.generated.Tour.*;

import static dev.restate.tour.generated.CheckoutRestate.CheckoutRestateClient;
import static dev.restate.tour.generated.TicketServiceRestate.TicketServiceRestateClient;

import java.time.Duration;
import java.util.HashSet;
import java.util.Set;

public class UserSession extends UserSessionRestate.UserSessionRestateImplBase {

    // <start_add_ticket>
    // At the top of the class, define the state key: supply a name and (de)serializer
    //highlight-start
    public static final StateKey<Set<String>> STATE_KEY = StateKey.of("tickets", JacksonSerdes.of(new TypeReference<>() {}));
    //highlight-end


    @Override
    public BoolValue addTicket(ObjectContext ctx, ReserveTicket request) throws TerminalException {
        Ticket ticket = Ticket.newBuilder().setTicketId(request.getTicketId()).build();
        TicketServiceRestateClient ticketClnt = TicketServiceRestate.newClient(ctx);
        BoolValue reservationSuccess = ticketClnt.reserve(ticket).await() ;

        if (reservationSuccess.getValue()) {
            //highlight-next-line
            Set<String> tickets = ctx.get(STATE_KEY).orElseGet(HashSet::new);
            tickets.add(request.getTicketId());
            //highlight-next-line
            ctx.set(STATE_KEY, tickets);

            ExpireTicketRequest expirationRequest =
                    ExpireTicketRequest.newBuilder().setTicketId(request.getTicketId()).setUserId(request.getUserId()).build();
            UserSessionRestate.UserSessionRestateClient userSessionClnt = UserSessionRestate.newClient(ctx);
            userSessionClnt.delayed(Duration.ofMinutes(15)).expireTicket(expirationRequest);
        }

        return reservationSuccess;
    }
    // <end_add_ticket>

    // <start_expire_ticket>
    @Override
    public void expireTicket(ObjectContext ctx, ExpireTicketRequest request) throws TerminalException {
        Set<String> tickets = ctx.get(STATE_KEY).orElseGet(HashSet::new);

        boolean removed = tickets.removeIf(s -> s.equals(request.getTicketId()));

        if (removed) {
            ctx.set(STATE_KEY, tickets);
            TicketServiceRestateClient ticketClnt = TicketServiceRestate.newClient(ctx);
            ticketClnt.oneWay().unreserve(Ticket.newBuilder().setTicketId(request.getTicketId()).build());
        }
    }
    // <end_expire_ticket>

    // <start_checkout>
    @Override
    public BoolValue checkout(ObjectContext ctx, CheckoutRequest request) throws TerminalException {
        //highlight-next-line
        Set<String> tickets = ctx.get(STATE_KEY).orElseGet(HashSet::new);

        //highlight-start
        if (tickets.isEmpty()) {
            return BoolValue.of(false);
        }
        //highlight-end

        CheckoutFlowRequest checkoutFlowRequest = CheckoutFlowRequest.newBuilder().setUserId(request.getUserId()).addTickets("456").build();
        CheckoutRestateClient checkoutClnt = CheckoutRestate.newClient(ctx);
        BoolValue checkoutSuccess = checkoutClnt.checkout(checkoutFlowRequest).await();

        if (checkoutSuccess.getValue()) {
            //highlight-next-line
            ctx.clear(STATE_KEY);
        }

        return checkoutSuccess;
    }
    // <end_checkout>

}
