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

import com.google.protobuf.BoolValue;
import dev.restate.sdk.ObjectContext;
import dev.restate.sdk.common.StateKey;
import dev.restate.sdk.common.TerminalException;
import dev.restate.sdk.serde.jackson.JacksonSerdes;
import dev.restate.tour.auxiliary.TicketStatus;
import dev.restate.tour.generated.TicketServiceRestate;
import dev.restate.tour.generated.Tour.Ticket;

public class TicketService extends TicketServiceRestate.TicketServiceRestateImplBase {

    public static final StateKey<TicketStatus> STATE_KEY = StateKey.of("status", JacksonSerdes.of(TicketStatus.class));

    @Override
    public BoolValue reserve(ObjectContext ctx, Ticket request) throws TerminalException {
        TicketStatus status = ctx.get(STATE_KEY).orElse(TicketStatus.Available);

        if (status.equals(TicketStatus.Available)) {
            ctx.set(STATE_KEY, TicketStatus.Reserved);
            return BoolValue.of(true);
        } else {
            return BoolValue.of(false);
        }
    }

    @Override
    public void unreserve(ObjectContext ctx, Ticket request) throws TerminalException {
        TicketStatus status = ctx.get(STATE_KEY).orElse(TicketStatus.Available);

        if (!status.equals(TicketStatus.Sold)) {
            ctx.clear(STATE_KEY);
        }
    }

    @Override
    public void markAsSold(ObjectContext ctx, Ticket request) throws TerminalException {
        TicketStatus status = ctx.get(STATE_KEY).orElse(TicketStatus.Available);

        if (status.equals(TicketStatus.Reserved)) {
            ctx.set(STATE_KEY, TicketStatus.Sold);
        }
    }
}
