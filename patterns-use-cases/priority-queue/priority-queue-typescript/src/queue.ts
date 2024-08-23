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
    tick: async (
      ctx: ObjectContext<QueueState>,
      cause: TickCause,
    ): Promise<void> => {
      let items = (await ctx.get("items")) ?? [];
      let inFlight = (await ctx.get("inFlight")) ?? 0;
      switch (cause?.type) {
        case "done":
          inFlight--;
          break;
        case "push":
          items.push(cause.item);
          break;
        case "drop":
          const index = items.findIndex(
            (item) => item.awakeable == cause.awakeable,
          );
          if (index == -1) {
            // we have already popped it; treat this as a 'done'
            inFlight--;
          } else {
            // remove from the queue
            items.splice(index, 1);
          }
          items = items.filter((item) => item.awakeable != cause.awakeable);
          break;
        default:
          throw new TerminalError(`unexpected queue tick cause ${cause}`);
      }

      while (inFlight < MAX_IN_FLIGHT && items.length > 0) {
        let item = selectAndPopItem(items);
        inFlight++;
        ctx.resolveAwakeable(item.awakeable);
      }

      ctx.console.log(
        `Tick end. Queue length: ${items.length}, In Flight: ${inFlight}`,
      );

      ctx.set("items", items);
      ctx.set("inFlight", inFlight);
    },
  },
});

export type Queue = typeof queue;
