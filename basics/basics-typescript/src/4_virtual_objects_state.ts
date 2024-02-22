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
// By default, only one method invocation can happen per object (per unique id)
// at the same time (single-writer per object).
//
// Among other things, Virtual Objects can be used to represent stateful
// entities like users or products.
//
//  - State is an exclusive part of the object, and cannot be accessed outside
//    the object. State is always available in the object during method executions,
//    without the need for a database or to fetch it from the server.
//
//  - Only one method can modify the state at any point in time, so there can
//    never be concurrent modifications.
//
//  - State changes atomically commit with the durable execution, meaning with the
//    method's return or with the journal progress (in case of multiple operations).
//    That makes the state always consistent with method executions.
//

const myObject = restate.keyedRouter({

  greet: async (ctx: restate.RpcContext, name: string, request: { greeting?: string }) => {
    const { greeting } = request;

    // access the state attached to this object (this 'name')
    // state access and updates are exclusive and consistent with the invocations
    let count = (await ctx.get<number>("count")) ?? 0;
    ctx.set("count", count + 1);

    // let's crash in some cases - this will not affect correctness!
    maybeCrash(0.5);

    return `${greeting ?? "Hello"} ${name} for the ${count + 1}-th time.`;
  }
});

// Add this function to the application:

// (a) Add it to an application task, process, HTTP server, RPC handler, ...
//    -> embedded function


// (b) Expose it as its own HTTP request handler through Restate

restate.createServer()
  .bindKeyedRouter("greeter", myObject)
  .listen(9080);

//
// See README for details on how to start and connect Restate server.
//
// Invoke this function for different keyes (names) and see the state progress.
//  - Some calls may take a bit longer, because the process crashes, restarts,
//   and Restate recovers the invocation.
// - Those crashes will not impact correctness, the result to the invocation (curl)
//   will always be correct.
// - Check the console where you started this Node/TypeScript program to see
//   those crashes/recovery happen. 
/*

curl localhost:8080/greeter/greet  -H 'content-type: application/json' -d \
'{
  "key": "Mary",
  "request": {
    "greeting": "Ping!"
  }
}'

*/
