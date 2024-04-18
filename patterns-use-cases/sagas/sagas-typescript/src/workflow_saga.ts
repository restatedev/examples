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

import { flights } from "./services/flights";
import { cars }  from "./services/cars";
import { payments } from "./services/payments";

//
//  An example of a trip reservation workflow, using the SAGAs pattern to
//  undo previous steps in case of an error.
//
//  The durable execution's guarantee to run code to the end in the presence
//  of failures, and to deterministically recover previous steps from the
//  journal, makes SAGAs easy.
//  Every step pushes a compensation action (an undo operation) to a stack.
//  in the case of an error, those operations are run.
//
//  The main requirement is that steps are implemented as journald
//  operations, like `ctx.run()` or rpc/messaging.

export default async (ctx: restate.Context, tripID: string) => {
  // create an compensation stack
  const compensations = [];
  try {
    //
    // call the flight API to reserve, keeping track of how to cancel
    //
    const flightBooking = await ctx.run("reserve a flight", () =>
      flights.reserve(tripID)
    );
    compensations.push(() => flights.cancel(tripID, flightBooking));

    //
    // call the car rental service API to reserve, keeping track of how to cancel
    //
    const carBooking = await ctx.run("rent a car", () => cars.reserve(tripID));
    compensations.push(() => cars.cancel(tripID, carBooking));

    //
    // call the payments API, keeping track of how to refund
    //
    const paymentId = await ctx.run("process payment", () =>
      payments.process({ tripID })
    );

    compensations.push(() => payments.refund({ tripID, paymentId }));

    //
    // confirm the flight and car reservations
    //
    await flights.confirm(tripID, flightBooking);
    await cars.confirm(tripID, carBooking);
  } catch (e: any) {
    // undo all the steps up to this point by running the compensations
    for (const compensation of compensations.reverse()) {
      await compensation();
    }

    // exit with an error
    throw new restate.TerminalError(
      `Travel reservation failed with an error: ${e.message}`,
      {
        cause: e,
      }
    );
  }
};
