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

export const carRentalService = restate.keyedRouter({
  reserve: async (ctx: restate.Context, tripID: string) => {
    // make a car reservation under an ID
    return "car__booking_id";
  },

  confirm: async (ctx: restate.Context, tripID: string, bookingId: string) => {
    // confirm the previous reservation
  },

  cancel: async (ctx: restate.Context, tripID: string, bookingId: string) => {
    // cancel previous reservation
  },
});

export const carRentalServiceApi: restate.ServiceApi<typeof carRentalService> = { path: "cars" };
