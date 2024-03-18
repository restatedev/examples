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
import dev.restate.tour.generated.TicketServiceRestate;
import dev.restate.tour.generated.Tour.Ticket;

import java.time.Duration;

public class TicketService extends TicketServiceRestate.TicketServiceRestateImplBase {

    // <start_reserve>
    @Override
    public BoolValue reserve(ObjectContext ctx, Ticket request) throws TerminalException {
        //bad-code-start
        try {
            Thread.sleep(65000);
        } catch (InterruptedException e) {
            throw new RuntimeException(e);
        }
        //bad-code-end
        return BoolValue.of(true);
    }
    // <end_reserve>

    @Override
    public void unreserve(ObjectContext ctx, Ticket request) throws TerminalException {
    }

    @Override
    public void markAsSold(ObjectContext ctx, Ticket request) throws TerminalException {
    }
}
