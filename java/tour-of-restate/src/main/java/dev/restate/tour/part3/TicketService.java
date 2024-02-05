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

package dev.restate.tour.part3;

import com.fasterxml.jackson.core.type.TypeReference;
import com.google.protobuf.BoolValue;
import dev.restate.sdk.RestateContext;
import dev.restate.sdk.common.StateKey;
import dev.restate.sdk.common.TerminalException;
import dev.restate.sdk.serde.jackson.JacksonSerdes;
import dev.restate.tour.auxiliary.TicketStatus;
import dev.restate.tour.generated.TicketServiceRestate;
import dev.restate.tour.generated.Tour.Ticket;

public class TicketService extends TicketServiceRestate.TicketServiceRestateImplBase {

    public static final StateKey<TicketStatus> STATE_KEY = StateKey.of("status", JacksonSerdes.of(TicketStatus.class));

    @Override
    public BoolValue reserve(RestateContext ctx, Ticket request) throws TerminalException {
        var status = ctx.get(STATE_KEY).orElse(TicketStatus.Available);

        if (status.equals(TicketStatus.Available)) {
            ctx.set(STATE_KEY, TicketStatus.Reserved);
            return BoolValue.of(true);
        } else {
            return BoolValue.of(false);
        }
    }

    @Override
    public void unreserve(RestateContext ctx, Ticket request) throws TerminalException {
        var status = ctx.get(STATE_KEY).orElse(TicketStatus.Available);

        if (!status.equals(TicketStatus.Sold)) {
            ctx.clear(STATE_KEY);
        }
    }

    @Override
    public void markAsSold(RestateContext ctx, Ticket request) throws TerminalException {
        var status = ctx.get(STATE_KEY).orElse(TicketStatus.Available);

        if (status.equals(TicketStatus.Reserved)) {
            ctx.set(STATE_KEY, TicketStatus.Sold);
        }
    }
}
