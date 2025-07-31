import * as restate from "@restatedev/restate-sdk";
import { bringUpMachine, Status, tearDownMachine } from "./utils/utils";

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

const machineOperator = restate.object({
  name: "machineOperator",
  handlers: {
    setUp: async (ctx: restate.ObjectContext) => {
      const machineId = ctx.key;

      // Ignore duplicate calls to 'setUp'
      const status = await ctx.get<Status>("status");
      if (status === Status.UP) {
        return `${machineId} is already up, so nothing to do`;
      }

      // Bringing up a machine is a slow process that frequently crashes
      // Any other requests to this Virtual Object will be enqueued until this handler is done
      await bringUpMachine(ctx, machineId);
      ctx.set("status", Status.UP);

      return `${machineId} is now up`;
    },

    tearDown: async (ctx: restate.ObjectContext) => {
      const machineId = ctx.key;

      const status = await ctx.get<Status>("status");
      if (status !== Status.UP) {
        return `${machineId} is not up, cannot tear down`;
      }

      // Tearing down a machine is a slow process that frequently crashes
      // Any other requests to this Virtual Object will be enqueued until this handler is done
      await tearDownMachine(ctx, machineId);
      ctx.set("status", Status.DOWN);

      return `${machineId} is now down`;
    },
  },
});

restate.serve({
  services: [machineOperator],
  port: 9080,
});
