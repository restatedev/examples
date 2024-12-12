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

export const cars = { 
    reserve: async (tripId: string) => {
      // make a car reservation under an ID
      return "car__booking_id";
    },

    confirm: async (tripId: string, bookingId: string) => {
      // confirm the previous reservation
    },

    cancel: async (tripId: string, bookingId: string) => {
      // cancel previous reservation
    },
};

