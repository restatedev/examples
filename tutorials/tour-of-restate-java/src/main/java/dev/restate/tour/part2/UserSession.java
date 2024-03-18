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

import com.google.protobuf.BoolValue;
import dev.restate.sdk.ObjectContext;
import dev.restate.sdk.common.TerminalException;
import dev.restate.tour.generated.CheckoutRestate;
import dev.restate.tour.generated.TicketServiceRestate;
import dev.restate.tour.generated.UserSessionRestate;

import java.time.Duration;

import static dev.restate.tour.generated.CheckoutRestate.CheckoutRestateClient;
import static dev.restate.tour.generated.TicketServiceRestate.TicketServiceRestateClient;
import static dev.restate.tour.generated.UserSessionRestate.UserSessionRestateClient;

import static dev.restate.tour.generated.Tour.*;

public class UserSession extends UserSessionRestate.UserSessionRestateImplBase {
    // <start_add_ticket>
    @Override
    public BoolValue addTicket(ObjectContext ctx, ReserveTicket request) throws TerminalException {
        Ticket ticket = Ticket.newBuilder().setTicketId(request.getTicketId()).build();
        TicketServiceRestateClient ticketClnt = TicketServiceRestate.newClient(ctx);
        BoolValue reservationSuccess = ticketClnt.reserve(ticket).await() ;

        if (reservationSuccess.getValue()) {
            ExpireTicketRequest expirationRequest =
                    ExpireTicketRequest.newBuilder().setTicketId(request.getTicketId()).setUserId(request.getUserId()).build();
            UserSessionRestateClient userSessionClnt = UserSessionRestate.newClient(ctx);
            // highlight-start
            userSessionClnt.delayed(Duration.ofMinutes(15)).expireTicket(expirationRequest);
            // highlight-end
        }

        return reservationSuccess;
    }
    // <end_add_ticket>

    @Override
    public void expireTicket(ObjectContext ctx, ExpireTicketRequest request) throws TerminalException {
        Ticket ticket = Ticket.newBuilder().setTicketId(request.getTicketId()).build();

        TicketServiceRestateClient ticketClnt = TicketServiceRestate.newClient(ctx);
        ticketClnt.oneWay().unreserve(ticket);
    }

    @Override
    public BoolValue checkout(ObjectContext ctx, CheckoutRequest request) throws TerminalException {
        CheckoutFlowRequest checkoutFlowRequest = CheckoutFlowRequest.newBuilder().setUserId(request.getUserId()).addTickets("456").build();
        CheckoutRestateClient checkoutClnt = CheckoutRestate.newClient(ctx);
        BoolValue checkoutSuccess = checkoutClnt.handle(checkoutFlowRequest).await();

        return checkoutSuccess;
    }

}
