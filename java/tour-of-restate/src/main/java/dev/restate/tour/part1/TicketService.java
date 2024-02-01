/*
 * Copyright (c) 2023 - Restate Software, Inc., Restate GmbH
 *
 * This file is part of the Tour of Restate Java,
 * which is released under the MIT license.
 *
 * You can find a copy of the license in the file LICENSE
 * in the root directory of this repository or package or at
 * https://github.com/restatedev/tour-of-restate
 */

package dev.restate.tour.part1;

import com.google.protobuf.BoolValue;
import dev.restate.sdk.RestateContext;
import dev.restate.sdk.common.TerminalException;
import dev.restate.tour.generated.TicketServiceRestate;
import dev.restate.tour.generated.Tour.Ticket;

import java.time.Duration;

public class TicketService extends TicketServiceRestate.TicketServiceRestateImplBase {

    @Override
    public BoolValue reserve(RestateContext ctx, Ticket request) throws TerminalException {
        ctx.sleep(Duration.ofSeconds(35));
        return BoolValue.of(true);
    }

    @Override
    public void unreserve(RestateContext ctx, Ticket request) throws TerminalException {
    }

    @Override
    public void markAsSold(RestateContext ctx, Ticket request) throws TerminalException {
    }
}
