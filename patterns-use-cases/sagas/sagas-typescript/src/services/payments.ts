/*
 * Copyright (c) 2024 - Restate Software, Inc., Restate GmbH
 *
 * This file is part of the Restate examples,
 * which is released under the MIT license.
 *
 * You can find a copy of the license in the file LICENSE
 * in the root directory of this repository or package or at
 * https://github.com/restatedev/examples/
 */

import * as restate from "@restatedev/restate-sdk";

export const paymentsService = restate.router({
    process: async (ctx: restate.Context, request: { tripID: string }) => {
        // make the payment
        return "paymend_id";
    },

    refund: async (ctx: restate.Context, request: { tripID: string, paymentId: string }) => {
        // refund the payment
    }
});

export const paymentsServiceApi: restate.ServiceApi<typeof paymentsService> = { path: "payments" };