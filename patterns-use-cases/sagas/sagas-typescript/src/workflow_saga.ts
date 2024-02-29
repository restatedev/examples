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
import { flightsServiceApi } from "./services/flights";
import { carRentalServiceApi } from "./services/cars";
import { paymentsServiceApi } from "./services/payments";

//
//  An example of a trip reservation workflow, using the SAGAs pattern to
//  undo previous steps in csase of an error.
//
//  The durable execution's guarantee to run code to the end in the presence
//  of failures, and to deterministically recover previous steps from the
//  journal, makes SAGAs easy.
//  Every step pushes a compensation action (an undo operation) to a stack.
//  in the case of an error, those operations are run.
//
//  The main requirement is that steps are implemented as journalled
//  operations, like `ctx.sideEffect()` or `ctx.rpc()`.

const reserveTrip = async (ctx: restate.Context, tripID: string) => {
  // set up RPC clients
  const flights = ctx.rpc(flightsServiceApi);
  const carRentals = ctx.rpc(carRentalServiceApi);
  const payments = ctx.rpc(paymentsServiceApi);

  // create an compensation stack
  const compensations = [];
  try {
    // call the flight API to reserve, keeping track of how to cancel
    const flightBooking = await flights.reserve(tripID);
    compensations.push(() => flights.cancel(tripID, flightBooking));

    // call the car rental service API to reserve, keeping track of how to cancel
    const carBooking = await carRentals.reserve(tripID);
    compensations.push(() => carRentals.cancel(tripID, carBooking));

    // call the payments API, keeping track of how to refund
    const paymentId = await payments.process({ tripID });
    compensations.push(() => payments.refund({ tripID, paymentId }));

    // confirm the flight and car reservations
    await flights.confirm(tripID, flightBooking);
    await carRentals.confirm(tripID, carBooking);
  } catch (e: any) {
    // undo all the steps up to this point by running the compensations
    for (const compensation of compensations.reverse()) {
      await compensation();
    }

    // exit with an error
    throw new restate.TerminalError(`Travel reservation failed with an error: ${e.message}`, {
      cause: e,
    });
  }
};
