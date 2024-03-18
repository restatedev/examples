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

import com.google.protobuf.BoolValue;
import dev.restate.sdk.Context;
import dev.restate.sdk.common.TerminalException;
import dev.restate.tour.generated.CheckoutRestate;
import dev.restate.tour.generated.Tour.CheckoutFlowRequest;

public class Checkout extends CheckoutRestate.CheckoutRestateImplBase {
    @Override
    public BoolValue checkout(Context ctx, CheckoutFlowRequest request) throws TerminalException {
        return BoolValue.of(true);
    }
}
