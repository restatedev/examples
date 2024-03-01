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

import com.google.protobuf.BoolValue;
import dev.restate.sdk.RestateContext;
import dev.restate.sdk.common.TerminalException;
import dev.restate.tour.generated.Tour.CheckoutRequest;
import dev.restate.tour.generated.Tour.ExpireTicketRequest;
import dev.restate.tour.generated.Tour.ReserveTicket;
import dev.restate.tour.generated.UserSessionRestate;

public class UserSession extends UserSessionRestate.UserSessionRestateImplBase {
    @Override
    public BoolValue addTicket(RestateContext ctx, ReserveTicket request) throws TerminalException {
        return BoolValue.of(true);
    }

    @Override
    public void expireTicket(RestateContext ctx, ExpireTicketRequest request) throws TerminalException {
    }

    @Override
    public BoolValue checkout(RestateContext ctx, CheckoutRequest request) throws TerminalException {
        return BoolValue.of(true);
    }
}