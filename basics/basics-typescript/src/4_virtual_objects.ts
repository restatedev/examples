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

//
// Virtual Objects hold state and have methods to interact with the object.
// An object is identified by a unique id - only one object exists per id.
//
// Virtual Objects have their state locally accessible without requiring any database
// connection or lookup. State is exclusive, and atomically committed with the
// method execution.
//
// Virtual Objects are _Stateful Serverless_ constructs.
//

const greeterObject = restate.keyedRouter({
  greet: async (ctx: restate.KeyedContext, name: string, request: { greeting?: string }) => {
    const greeting = request?.greeting ?? "Hello";

    // access the state attached to this object (this 'name')
    // state access and updates are exclusive and consistent with the invocations
    let count = (await ctx.get<number>("count")) ?? 0;
    count++;
    ctx.set("count", count);
    return `${greeting} ${name} for the ${count}-th time.`;
  },

  ungreet: async (ctx: restate.KeyedContext, name: string, request: {}) => {
    let count = (await ctx.get<number>("count")) ?? 0;
    if (count > 0) {
      count--;
    }
    ctx.set("count", count);
    return `Dear ${name}, taking one greeting back: ${count}.`;
  },
});

// you can call this now through http directly the following way

example1: `curl localhost:8080/greeter/greet   -H 'content-type: application/json' -d '{ "key": "Mary" }'`;
example2: `curl localhost:8080/greeter/greet   -H 'content-type: application/json' -d '{ "key": "Barack" }'`;
example3: `curl localhost:8080/greeter/ungreet -H 'content-type: application/json' -d '{ "key": "Mary" }'`;

// --------------------------------- deploying --------------------------------

const serve = restate.endpoint().bindKeyedRouter("greeter", greeterObject);

serve.listen(9080);
// or serve.lambdaHandler();
// or serve.http2Handler();
// or ...

// See README for details on how to start and connect to Restate.
