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

import {
  handlers,
  object,
  ObjectContext,
  ObjectSharedContext,
} from "@restatedev/restate-sdk";

type BatcherState = {
  index: number;
  items: unknown[];
};

const MAX_BATCH = 10;
const MAX_BATCH_WAIT_MS = 1000;

export const batcher = object({
  name: "batcher",
  handlers: {
    expire: handlers.object.shared(
      async (
        ctx: ObjectSharedContext<BatcherState>,
        index: number,
      ): Promise<void> => {
        const currentIndex = (await ctx.get("index")) ?? 0;

        if (index !== currentIndex) {
          // the batch was already sent within the expiry
          return;
        } else {
          // slow path: we need to lock the key to send the batch
          // we pay the cost of an additional invocation because we expect
          // this path to be much rarer. once invocation cancellation is
          // available in the SDK, we could instead cancel this expire call
          // when the batch is sent, in which case this would be the only path
          // and we could merge the handlers.
          ctx
            .objectSendClient<Batcher>({ name: "batcher" }, ctx.key)
            .expireSlow(index);
        }
      },
    ),
    expireSlow: async (ctx: ObjectContext<BatcherState>, index: number) => {
      const currentIndex = (await ctx.get("index")) ?? 0;

      if (index !== currentIndex) {
        // the batch was sent in between the expire and expireSlow call
        return;
      }

      const items = (await ctx.get("items")) ?? [];
      ctx.console.log(
        `Sending batch ${index} with ${items.length} items as the timer fired`,
      );
      return sendBatch(ctx, index, items);
    },
    receive: async (
      ctx: ObjectContext<BatcherState>,
      item: unknown,
    ): Promise<void> => {
      const index = (await ctx.get("index")) ?? 0;
      const items = (await ctx.get("items")) ?? [];

      items.push(item);

      if (items.length >= MAX_BATCH) {
        ctx.console.log(
          `Sending batch ${index} as it reached ${MAX_BATCH} items`,
        );

        return sendBatch(ctx, index, items);
      }

      if (items.length == 1) {
        ctx.console.log(
          `Adding item to new batch ${index}, will send in at most ${MAX_BATCH_WAIT_MS} ms`,
        );

        ctx
          .objectSendClient<Batcher>({ name: "batcher" }, ctx.key, {
            delay: MAX_BATCH_WAIT_MS,
          })
          .expire(index);
      } else {
        ctx.console.log(`Adding item to batch ${index}`);
      }

      ctx.set("items", items);
    },
  },
});

type Batch = {
  items: unknown[];
};

export const batchReceiver = object({
  name: "batchReceiver",
  handlers: {
    receive: async (ctx: ObjectContext, batch: Batch): Promise<void> => {
      ctx.console.log("Received batch:", batch);
      // do stuff
    },
  },
});

function sendBatch(
  ctx: ObjectContext<BatcherState>,
  index: number,
  items: unknown[],
): void {
  ctx.set("index", index + 1);
  ctx.clear("items");

  ctx
    .objectSendClient<BatchReceiver>({ name: "batchReceiver" }, ctx.key)
    .receive({ items });
}

export type Batcher = typeof batcher;
export type BatchReceiver = typeof batchReceiver;
