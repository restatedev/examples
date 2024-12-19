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

import { object, ObjectContext, TerminalError } from "@restatedev/restate-sdk";

type QueueState = {
  items: QueueItem[];
  inFlight: number;
};

type QueueItem = {
  awakeable: string;
  priority: number;
};

type TickCause =
  | { type: "done" }
  | { type: "push"; item: QueueItem }
  | { type: "drop"; awakeable: string };

// Put your super clever queue fairness algorithm here
function selectAndPopItem<T>(items: QueueItem[]): QueueItem {
  let lowest = { priority: Number.MAX_SAFE_INTEGER, index: 0 };
  for (const [i, item] of items.entries()) {
    if (item.priority < lowest.priority) {
      lowest.priority = item.priority;
      lowest.index = i;
    }
  }
  const [item] = items.splice(lowest.index, 1);
  return item;
}

const MAX_IN_FLIGHT = 10;

export const queue = object({
  name: "queue",
  handlers: {
    done: async (ctx: ObjectContext<QueueState>): Promise<void> => {
      const state = await getState(ctx);

      state.inFlight--;

      tick(ctx, state);

      setState(ctx, state);
    },
    push: async (
      ctx: ObjectContext<QueueState>,
      item: QueueItem,
    ): Promise<void> => {
      const state = await getState(ctx);

      state.items.push(item);

      tick(ctx, state);

      setState(ctx, state);
    },
    drop: async (
      ctx: ObjectContext<QueueState>,
      awakeable: string,
    ): Promise<void> => {
      const state = await getState(ctx);

      const index = state.items.findIndex(
        (item) => item.awakeable == awakeable,
      );
      if (index == -1) {
        // we have already popped it; treat this as a 'done'
        state.inFlight--;
      } else {
        // remove from the queue
        state.items.splice(index, 1);
      }

      tick(ctx, state);

      setState(ctx, state);
    },
  },
});

async function getState(ctx: ObjectContext<QueueState>): Promise<QueueState> {
  return {
    items: (await ctx.get("items")) ?? [],
    inFlight: (await ctx.get("inFlight")) ?? 0,
  };
}

function setState(ctx: ObjectContext<QueueState>, state: QueueState) {
  ctx.set("items", state.items);
  ctx.set("inFlight", state.inFlight);
}

function tick(ctx: ObjectContext<QueueState>, state: QueueState) {
  while (state.inFlight < MAX_IN_FLIGHT && state.items.length > 0) {
    let item = selectAndPopItem(state.items);
    state.inFlight++;
    ctx.resolveAwakeable(item.awakeable);
  }

  ctx.console.log(
    `Tick end. Queue length: ${state.items.length}, In Flight: ${state.inFlight}`,
  );
}

export type Queue = typeof queue;
