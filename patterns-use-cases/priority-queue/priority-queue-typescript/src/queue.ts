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
  | {
      type: "done";
    }
  | { type: "push"; item: QueueItem };

// Put your super clever queue fairness algorithm here
function selectAndPopItem<T>(items: QueueItem[]): QueueItem {
  return items.pop()!;
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
