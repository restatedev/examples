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

import com.google.protobuf.BoolValue;
import dev.restate.sdk.ObjectContext;
import dev.restate.sdk.common.TerminalException;
import dev.restate.tour.generated.CheckoutRestate;
import dev.restate.tour.generated.TicketServiceRestate;
import dev.restate.tour.generated.UserSessionRestate;

import static dev.restate.tour.generated.Tour.*;
import static dev.restate.tour.generated.TicketServiceRestate.*;
import static dev.restate.tour.generated.CheckoutRestate.*;

public class UserSession extends UserSessionRestate.UserSessionRestateImplBase {
    // <start_add_ticket>
    @Override
    public BoolValue addTicket(ObjectContext ctx, ReserveTicket request) throws TerminalException {
        Ticket ticket = Ticket.newBuilder().setTicketId(request.getTicketId()).build();

        //highlight-start
        TicketServiceRestateClient ticketClnt = TicketServiceRestate.newClient(ctx);
        BoolValue reservationSuccess = ticketClnt.reserve(ticket).await() ;
        //highlight-end

        return BoolValue.of(true);
    }
    // <end_add_ticket>

    // <start_expire_ticket>
    @Override
    public void expireTicket(ObjectContext ctx, ExpireTicketRequest request) throws TerminalException {
        Ticket ticket = Ticket.newBuilder().setTicketId(request.getTicketId()).build();

        //highlight-start
        TicketServiceRestateClient ticketClnt = TicketServiceRestate.newClient(ctx);
        ticketClnt.oneWay().unreserve(ticket);
        //highlight-end
    }
    // <end_expire_ticket>

    // <start_checkout>
    @Override
    public BoolValue checkout(ObjectContext ctx, CheckoutRequest request) throws TerminalException {
        CheckoutFlowRequest checkoutFlowRequest = CheckoutFlowRequest.newBuilder().setUserId(request.getUserId()).addTickets("456").build();
        CheckoutRestateClient checkoutClnt = CheckoutRestate.newClient(ctx);
        BoolValue checkoutSuccess = checkoutClnt.checkout(checkoutFlowRequest).await();

        return checkoutSuccess;
    }
    // <end_checkout>

}
