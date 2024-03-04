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

export const flightsService = restate.keyedRouter({
  reserve: async (ctx: restate.Context, tripID: string) => {
    // reserve flight
    return "flight_id";
  },

  confirm: async (ctx: restate.Context, tripID: string, bookingId: string) => {
    // confirm flight
  },

  cancel: async (ctx: restate.Context, tripID: string, bookingId: string) => {
    // cancel booking event
  },
});

export const flightsServiceApi: restate.ServiceApi<typeof flightsService> = { path: "flights" };
