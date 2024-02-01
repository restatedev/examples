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

package dev.restate.tour.part2;

import com.google.protobuf.BoolValue;
import dev.restate.sdk.RestateContext;
import dev.restate.sdk.common.CoreSerdes;
import dev.restate.sdk.common.TerminalException;
import dev.restate.tour.generated.CheckoutRestate;
import dev.restate.tour.generated.Tour.CheckoutFlowRequest;

import java.time.Duration;
import java.util.UUID;

public class Checkout extends CheckoutRestate.CheckoutRestateImplBase {
    @Override
    public BoolValue checkout(RestateContext ctx, CheckoutFlowRequest request) throws TerminalException {
        return BoolValue.of(true);
    }
}
