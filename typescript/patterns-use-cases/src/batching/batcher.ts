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
import { ObjectContext } from "@restatedev/restate-sdk";

type BatcherState = {
  items: unknown[];
  expireInvocationId: restate.InvocationId;
};

const MAX_BATCH = 10;
const MAX_BATCH_WAIT_MS = 1000;

export const batcher = restate.object({
  name: "batcher",
  handlers: {
    expire: async (ctx: ObjectContext<BatcherState>) => {
      const items = (await ctx.get("items")) ?? [];
      ctx.console.log(`Sending batch with ${items.length} items as the timer fired`);
      return sendBatch(ctx, null, items);
    },
    receive: async (ctx: ObjectContext<BatcherState>, item: unknown): Promise<void> => {
      const expireInvocationId = await ctx.get("expireInvocationId");
      const items = (await ctx.get("items")) ?? [];

      items.push(item);

      if (items.length >= MAX_BATCH) {
        ctx.console.log(`Sending batch as it reached ${MAX_BATCH} items`);

        return sendBatch(ctx, expireInvocationId, items);
      }

      if (items.length == 1) {
        ctx.console.log(`Adding item to new batch, will send in at most ${MAX_BATCH_WAIT_MS} ms`);

        const expirationHandle = ctx
          .objectSendClient<Batcher>({ name: "batcher" }, ctx.key, {
            delay: MAX_BATCH_WAIT_MS,
          })
          .expire();

        // Waiting for the expiration invocation ID can trigger a suspension, but this way we can avoid the vast majority of 'expire' calls
        // via cancellation, which reduces executions overall.
        ctx.set("expireInvocationId", await expirationHandle.invocationId);
      } else {
        ctx.console.log(`Adding item to batch`);
      }

      ctx.set("items", items);
    },
  },
});

type Batch = {
  items: unknown[];
};

export const batchReceiver = restate.object({
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
  expireInvocationId: restate.InvocationId | null,
  items: unknown[]
): void {
  if (expireInvocationId) {
    ctx.cancel(expireInvocationId);
  }
  ctx.clear("expireInvocationId");
  ctx.clear("items");

  ctx.objectSendClient<BatchReceiver>({ name: "batchReceiver" }, ctx.key).receive({ items });
}

export type Batcher = typeof batcher;
export type BatchReceiver = typeof batchReceiver;

restate.endpoint().bind(batcher).bind(batchReceiver).listen();
