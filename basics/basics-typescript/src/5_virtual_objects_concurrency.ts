/*
 * Copyright (c) 2024 - Restate Software, Inc., Restate GmbH
 *
 * This file is part of the Restate Examples for the Node.js/TypeScript SDK,
 * which is released under the MIT license.
 *
 * You can find a copy of the license in the file LICENSE
 * in the root directory of this repository or package or at
 * https://github.com/restatedev/examples/blob/main/LICENSE
 */

import * as restate from "@restatedev/restate-sdk";
import { maybeCrash } from "./utils/failures";

// Virtual Objects hold state and have methods to interact with the object.
// An object is identified by a unique id - only one object exists per id.
//
// By default, only one method invocation can happen per object (per unique id)
// at the same time (single-writer per object).
//
// This "single-writer-per-key" characteristic makes them useful to ensure
// sequential processing of operations per id (resource, user, ...).
// That makes objects effectively
//   >> fine-grained queues with state and durable execution <<
// super powerful primitive.
//
// Below we use this to implement a very simple state machine that executes
// very long operations during transition.

enum State { UP = "UP", DOWN = "DOWN" }

const myObject = restate.keyedRouter({

  setUp: async (ctx: restate.RpcContext, resourceKey: string, request: {}) => {
    const state = (await ctx.get<State>("state")) ?? State.DOWN;
    console.log(` >>> Invoking 'setUp()' for ${resourceKey} in state ${state}`);

    // the state cannot be incosistent, but someone could call 'setUp' multiple times in a row
    if (state === State.UP) {
      console.log(`>>> Resource ${resourceKey} is already UP, so nothing to do`);
      return `${resourceKey} is already UP`
    }

    // the work is hard: it frequently crashes and takes a loooong time
    console.log(` >>> Beginning transition of ${resourceKey} to UP`);
    maybeCrash(0.4);
    await ctx.sleep(5000);

    console.log(` >>> Done transitioning ${resourceKey} to UP`);
    ctx.set("state", State.UP);
    return `${resourceKey} is now UP`
  },

  tearDown: async (ctx: restate.RpcContext, resourceKey: string, request: {}) => {
    const state = await ctx.get<State>("state");
    console.log(` >>> Invoking 'tearDown()' for ${resourceKey} in state ${state}`);

    if (state !== State.UP) {
      console.log(`" >>> Resource ${resourceKey} is not UP, cannot tear down`);
      return `${resourceKey} is not yet UP`
    }

    // the work is hard: it frequently crashes and takes a loooong time
    console.log(` >>> Beginning transition of ${resourceKey} to DOWN`);
    maybeCrash(0.4);
    await ctx.sleep(5000);

    console.log(` >>> Done transitioning ${resourceKey} to DOWN`);
    ctx.set("state", State.DOWN);
    return `${resourceKey} is now DOWN`
  },
});

// Add this function to the application:

// (a) Add it to an application task, process, HTTP server, RPC handler, ...
//    -> embedded function


// (b) Expose it as its own HTTP request handler through Restate

restate.createServer()
  .bindKeyedRouter("resource", myObject)
  .listen(9080);


//
// See README for details on how to start and connect Restate server.
//
// To illustrate the concurrency safety here, send multiple requests without waiting on
// results and see how they play out sequentially per object (state machine).
// Copy all the curl command lines below together and paste them to the terminal together.
//
// You will see both from the later results (in the terminal with the curl commands) and in
// the log of the NodeJs process that the requests queue per object key and safely execute
// unaffected by crashes and recoveries.
/*
curl localhost:8080/resource/setUp    -H 'content-type: application/json' -d '{ "key": "A" }' &
curl localhost:8080/resource/tearDown -H 'content-type: application/json' -d '{ "key": "A" }' &
curl localhost:8080/resource/setUp    -H 'content-type: application/json' -d '{ "key": "B" }' &
curl localhost:8080/resource/setUp    -H 'content-type: application/json' -d '{ "key": "B" }' &
curl localhost:8080/resource/tearDown -H 'content-type: application/json' -d '{ "key": "B" }' &
for job in `jobs -p`; do wait $job; done
;
*/
