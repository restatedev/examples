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
import dev.restate.sdk.annotation.Handler;
import dev.restate.sdk.annotation.Service;
import dev.restate.tour.auxiliary.CheckoutRequest;

// <start_service>
@Service
public class CheckoutService {
    @Handler
    public boolean handle(Context ctx, CheckoutRequest request) {
        return true;
    }
}
// <start_service>
