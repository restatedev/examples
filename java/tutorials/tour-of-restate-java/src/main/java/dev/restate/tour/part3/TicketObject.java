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

import dev.restate.sdk.ObjectContext;
import dev.restate.sdk.annotation.Handler;
import dev.restate.sdk.annotation.VirtualObject;
import dev.restate.sdk.common.StateKey;
import dev.restate.tour.auxiliary.TicketStatus;

@VirtualObject
public class TicketObject {
    // <start_reserve>
    public static final StateKey<TicketStatus> STATE_KEY = StateKey.of("status", TicketStatus.class);

    @Handler
    public boolean reserve(ObjectContext ctx) {
        TicketStatus status = ctx.get(STATE_KEY).orElse(TicketStatus.Available);

        if (status.equals(TicketStatus.Available)) {
            ctx.set(STATE_KEY, TicketStatus.Reserved);
            return true;
        } else {
            return false;
        }
    }
    // <end_reserve>

    // <start_unreserve>
    @Handler
    public void unreserve(ObjectContext ctx) {
        TicketStatus status = ctx.get(STATE_KEY).orElse(TicketStatus.Available);

        if (!status.equals(TicketStatus.Sold)) {
            ctx.clear(STATE_KEY);
        }
    }
    // <end_unreserve>

    // <start_mark_as_sold>
    @Handler
    public void markAsSold(ObjectContext ctx) {
        TicketStatus status = ctx.get(STATE_KEY).orElse(TicketStatus.Available);

        if (status.equals(TicketStatus.Reserved)) {
            ctx.set(STATE_KEY, TicketStatus.Sold);
        }
    }
    // <end_mark_as_sold>

}
