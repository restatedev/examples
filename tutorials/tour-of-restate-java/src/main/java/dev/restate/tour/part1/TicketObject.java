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

import dev.restate.sdk.ObjectContext;
import dev.restate.sdk.annotation.Handler;
import dev.restate.sdk.annotation.VirtualObject;

@VirtualObject
public class TicketObject {

    // <start_reserve>
    @Handler
    public boolean reserve(ObjectContext ctx) {
        //bad-code-start
        try {
            Thread.sleep(65000);
        } catch (InterruptedException e) {
            throw new RuntimeException(e);
        }
        //bad-code-end

        return true;
    }
    // <end_reserve>

    @Handler
    public void unreserve(ObjectContext ctx) {
    }

    @Handler
    public void markAsSold(ObjectContext ctx) {
    }
}
