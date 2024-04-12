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

import dev.restate.sdk.Context;
import dev.restate.sdk.annotation.Handler;
import dev.restate.sdk.annotation.Service;

@Service
public class CartObject {
    @Handler
    public boolean addTicket(Context ctx, String ticketId) {
        return true;
    }

    @Handler
    public void expireTicket(Context ctx, String ticketId) {
    }

    @Handler
    public boolean checkout(Context ctx) {
        return true;
    }
}