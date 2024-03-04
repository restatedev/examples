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

package dev.restate.tour.app;

import com.google.protobuf.BoolValue;
import dev.restate.sdk.ObjectContext;
import dev.restate.sdk.common.TerminalException;
import dev.restate.tour.generated.TicketServiceRestate;
import dev.restate.tour.generated.Tour.Ticket;

public class TicketService extends TicketServiceRestate.TicketServiceRestateImplBase {
    @Override
    public BoolValue reserve(ObjectContext ctx, Ticket request) throws TerminalException {
        return BoolValue.of(true);
    }

    @Override
    public void unreserve(ObjectContext ctx, Ticket request) throws TerminalException {
    }

    @Override
    public void markAsSold(ObjectContext ctx, Ticket request) throws TerminalException {
    }
}
