import * as restate from "@restatedev/restate-sdk";
import {bringUpMachine, State, tearDownMachine} from "./utils/utils";

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

const machineManagement = restate.object({
  name: "machineManagement",
  handlers: {
    setUp: async (ctx: restate.ObjectContext) => {
      const machineId = ctx.key;

      // Ignore duplicate calls to 'setUp'
      const state = await ctx.get<State>("state");
      if (state === State.UP) {
        return `${machineId} is already up, so nothing to do`;
      }

      // Bringing up a machine is a slow process that frequently crashes
      ctx.console.info(`Beginning transition of ${machineId} to UP`);
      await bringUpMachine(ctx, machineId);

      ctx.console.info(`Done transitioning ${machineId} to UP`);
      ctx.set("state", State.UP);
      return `${machineId} is now up`;
    },

    tearDown: async (ctx: restate.ObjectContext) => {
      const machineId = ctx.key;

      const state = await ctx.get<State>("state");
      if (state !== State.UP) {
        ctx.console.info(`${machineId} is not UP, cannot tear down`);
        return `${machineId} is not yet UP`;
      }

      // Tearing down a machine is a slow process that frequently crashes
      ctx.console.info(`Beginning transition of ${machineId} to DOWN`);
      await tearDownMachine(ctx, machineId);

      ctx.console.info(`Done transitioning ${machineId} to DOWN`);
      ctx.set("state", State.DOWN);
      return `${machineId} is now DOWN`;
    },
  },
});

restate.endpoint().bind(machineManagement).listen(9080);
