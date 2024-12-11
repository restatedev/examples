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

const greeterObject = restate.object({
  name: "greeter",
  handlers: {
    greet: async (
      ctx: restate.ObjectContext,
      request: { greeting?: string },
    ) => {
      const greeting = request?.greeting ?? "Hello";

      // Access the state attached to this object (this 'name')
      // State access and updates are exclusive and consistent with the invocations
      let count = (await ctx.get<number>("count")) ?? 0;
      count++;
      ctx.set("count", count);
      return `${greeting} ${ctx.key} for the ${count}-th time.`;
    },

    ungreet: async (ctx: restate.ObjectContext) => {
      let count = (await ctx.get<number>("count")) ?? 0;
      if (count > 0) {
        count--;
      }
      ctx.set("count", count);
      return `Dear ${ctx.key}, taking one greeting back: ${count}.`;
    },
  },
});

// you can call this now through http directly the following way

// example1: `curl localhost:8080/greeter/mary/greet -H 'content-type: application/json' -d '{ "greeting" : "Hi" }'`;
// example2: `curl localhost:8080/greeter/barack/greet -H 'content-type: application/json' -d '{"greeting" : "Hello" }'`;
// example3: `curl localhost:8080/greeter/mary/ungreet -H 'content-type: application/json' -d '{}'`;

// --------------------------------- deploying --------------------------------

const serve = restate.endpoint().bind(greeterObject);

serve.listen(9080);
// or serve.http2Handler();
// or serve.handler() from "@restatedev/restate-sdk/lambda" or "@restatedev/restate-sdk/fetch"
// or ...

// See README for details on how to start and connect to Restate.
