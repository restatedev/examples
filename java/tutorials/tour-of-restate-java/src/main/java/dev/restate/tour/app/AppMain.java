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

import dev.restate.sdk.endpoint.Endpoint;
import dev.restate.sdk.http.vertx.RestateHttpServer;

public class AppMain {
    public static void main(String[] args) {
        RestateHttpServer.listen(
            Endpoint
                .bind(new CheckoutService())
                .bind(new TicketObject())
                .bind(new CartObject())
        );
    }
}
