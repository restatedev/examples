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

//  -----------------                                         -----------------
//                              Compensations 
//  -----------------                                         -----------------
//
// Restate guarantees that your invocations are run to completion no matter 
// what happens. However, in case you want your services to be able to respond
// with exceptions as part of the normal control flow (i.e. denoting a negative
// outcome) you can let the callee throw a `TerminalError`. If the caller has
// completed previous steps before receiving the `TerminalError`, it will have
// to undo those steps in order to leave the system in a consistent state. The
// way to undo steps is by registering compensations and running them for all
// completed steps. With Restate, this can be naturally expressed as part of 
// the service code. Moreover, Restate runs the compensations with the same
// guarantees as the service code, i.e. it executes them durably until they 
// complete, which guarantees that the system will be left in a consistent 
// state.
//
// The very same mechanism of undoing completed steps via compensations is 
// also needed if you want to gracefully cancel an invocation, i.e. because it
// is no longer needed or stuck, and leave the system in a consistent state.
// The way a graceful cancellation manifests is by throwing a `TerminalError` 
// at the next Restate API call. In fact, Restate starts cancelling your
// invocation call tree starting with the leaf invocations first and then
// propagating the cancellation error up. Given that your service code is
// properly instrumented with compensations, you know that an invocation which
// completed with a `TerminalError` has not made any changes to the system and
// the caller only needs to undo the steps that have been completed successfully 
// before.

// ----------------------------------------------------------------------------
// Trip reservation workflow which has been instrumented with compensations.
// The workflow tries to reserve the flight and the car rental before it 
// processes the payment. If at any point one of the calls fails or gets 
// cancelled, then the trip reservation workflow will undo all successfully
// completed steps by running the compensations.
//
// Note: that the compensation logic is purely implemented in the user code
// and runs durably until it completes. Moreover, an invocation failure and
// an invocation cancellation are handled in the exact same way by the caller.
const reserveTrip = async (ctx: restate.RpcContext, tripID: string) => {
    // set up RPC clients
    const flights = ctx.rpc(flightsService);
    const carRentals = ctx.rpc(carRentalService);
    const payments = ctx.rpc(paymentsService);

    // create an compensation stack
    const compensations = [];
    try {
        // call the flights Lambda to reserve, keeping track of how to cancel
        const flightBooking = await flights.reserve(tripID);
        compensations.push(() => flights.cancel(tripID, flightBooking));

        // RPC the rental service to reserve, keeping track of how to cancel
        const carBooking = await carRentals.reserve(tripID);
        compensations.push(() => carRentals.cancel(tripID, carBooking));

        // RPC the payments service to process, keeping track of how to refund
        const payment = await payments.process(tripID);
        compensations.push(() => payments.refund(tripID, payment));

        // confirm the flight and car
        await flights.confirm(tripID, flightBooking);
        await carRentals.confirm(tripID, carBooking);
    } catch (e) {
        // undo all the steps up to this point by running the compensations
        for (const compensation of compensations.reverse()) {
            await compensation();
        }

        // exit with an error
        throw new restate.TerminalError(`Travel reservation failed with err '${e}'`);
    }
}

export const tripsRouter = restate.router({ reserveTrip });
export const tripsService: restate.ServiceApi<typeof tripsRouter> = { path: "trips" };

// ----------------------------------------------------------------------------
// Stubs of the other services to make the example compile

// flights service

const reserveFlight = async (
    ctx: restate.RpcContext,
    tripID: string,
) => {
    // reserve flight
    return "flight_id";
};

const confirmFlight = async (
    ctx: restate.RpcContext,
    tripID: string,
    bookingId: string,
) => {
    // confirm flight
};

const cancelFlight = async (ctx: restate.RpcContext, tripID: string, bookingId: string) => {
    // cancel booking event
};

export const flightsRouter = restate.keyedRouter({ reserve: reserveFlight, confirm: confirmFlight, cancel: cancelFlight });
export const flightsService: restate.ServiceApi<typeof flightsRouter> = { path: "flights" };

// car rental service

const reserveCar = async (ctx: restate.RpcContext, tripID: string) => {
    // reserve car
    return "car_id";
};

const confirmCar = async (ctx: restate.RpcContext, tripID: string, bookingId: string) => {
    // confirm car reservation
};

const cancelCar = async (ctx: restate.RpcContext, tripID: string, bookingId: string) => {
    // cancel car reservation
};

export const carRentalRouter = restate.keyedRouter({ reserve: reserveCar, confirm: confirmCar, cancel: cancelCar });
export const carRentalService: restate.ServiceApi<typeof carRentalRouter> = { path: "cars" };

// payment service

const process = async (ctx: restate.RpcContext, tripID: string) => {
    // process payment
    return "paymend_id";
};


const refund = async (ctx: restate.RpcContext, tripID: string, paymentId: string) => {
    // refund payment
};

export const paymentsRouter = restate.keyedRouter({ process, refund });
export const paymentsService: restate.ServiceApi<typeof paymentsRouter> = { path: "payments" };