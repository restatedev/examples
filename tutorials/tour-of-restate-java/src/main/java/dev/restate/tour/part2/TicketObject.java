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

import dev.restate.sdk.Context;
import dev.restate.sdk.annotation.Handler;
import dev.restate.sdk.annotation.Service;

import java.time.Duration;

@Service
public class TicketObject {

    // <start_reserve>
    @Handler
    public boolean reserve(Context ctx) {
        // withClass highlight-good-code
        ctx.sleep(Duration.ofSeconds(65));

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
