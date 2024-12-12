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

export const flights = {
  reserve: async (tripId: string) => {
    // reserve flight
    return "flight_id";
  },

  confirm: async (tripId: string, bookingId: string) => {
    // confirm flight
  },

  cancel: async (tripId: string, bookingId: string) => {
    // cancel booking event
  },
};
