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

// This is a State Machine implemented with a Virtual Object
//
// - The object holds the state of the state machine and defines the methods
//   to transition between the states.
// - The object's unique id identifies the state machine. Many parallel state
//   machines exist, but only state machine (object) exists per id.
// - The "single-writer-per-key" characteristic of virtual objects ensures
//   that one state transition per state machine is in progress at a time.
//   Additional transitions are enqueued for that object, while a transition
//   for a machine is still in progress.

enum State {
  UP = "UP",
  DOWN = "DOWN",
}

const resource = restate.object({
  name: "resource",
  handlers: {
    setUp: async (ctx: restate.ObjectContext) => {
      const state = (await ctx.get<State>("state")) ?? State.DOWN;
      const stateMachineId = ctx.key;

      ctx.console.log(
        ` >>> Invoking 'setUp()' for ${stateMachineId} in state ${state}`,
      );

      // the state cannot be inconsistent, but someone could call 'setUp' multiple times in a row
      if (state === State.UP) {
        ctx.console.log(
          `>>> Resource ${stateMachineId} is already UP, so nothing to do`,
        );
        return `${stateMachineId} is already UP`;
      }

      // the work is hard: it frequently crashes and takes a loooong time
      ctx.console.log(` >>> Beginning transition of ${stateMachineId} to UP`);
      maybeCrash(0.4);
      await ctx.sleep(5000);

      ctx.console.log(` >>> Done transitioning ${stateMachineId} to UP`);
      ctx.set("state", State.UP);
      return `${stateMachineId} is now UP`;
    },

    tearDown: async (ctx: restate.ObjectContext) => {
      const state = await ctx.get<State>("state");
      const stateMachineId = ctx.key;

      ctx.console.log(
        ` >>> Invoking 'tearDown()' for ${stateMachineId} in state ${state}`,
      );

      if (state !== State.UP) {
        ctx.console.log(
          `" >>> Resource ${stateMachineId} is not UP, cannot tear down`,
        );
        return `${stateMachineId} is not yet UP`;
      }

      // the work is hard: it frequently crashes and takes a loooong time
      ctx.console.log(` >>> Beginning transition of ${stateMachineId} to DOWN`);
      maybeCrash(0.4);
      await ctx.sleep(5000);

      ctx.console.log(` >>> Done transitioning ${stateMachineId} to DOWN`);
      ctx.set("state", State.DOWN);
      return `${stateMachineId} is now DOWN`;
    },
  },
});

// ------------------------------- Deploy & Run -------------------------------

const serve = restate.endpoint().bind(resource);

serve.listen(9080);
// or serve.http2Handler();
// or serve.handler() from "@restatedev/restate-sdk/lambda" or "@restatedev/restate-sdk/fetch"
// or ...

//
// See README for details on how to start and connect Restate server.
//
