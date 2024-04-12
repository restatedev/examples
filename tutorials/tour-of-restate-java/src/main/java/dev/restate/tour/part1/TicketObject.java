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

import dev.restate.sdk.Context;
import dev.restate.sdk.ObjectContext;
import dev.restate.sdk.annotation.Handler;
import dev.restate.sdk.annotation.Service;

@Service
public class TicketObject {

    // <start_reserve>
    @Handler
    public boolean reserve(Context ctx) {
        // withClass highlight-bad-code
        try {
            // withClass highlight-bad-code
            Thread.sleep(65000);
            // withClass highlight-bad-code
        } catch (InterruptedException e) {
            // withClass highlight-bad-code
            throw new RuntimeException(e);
            // withClass highlight-bad-code
        }

        return true;
    }
    // <end_reserve>

    @Handler
    public void unreserve(Context ctx) {
    }

    @Handler
    public void markAsSold(Context ctx) {
    }
}
