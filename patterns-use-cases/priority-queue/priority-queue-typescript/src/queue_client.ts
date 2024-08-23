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

import { Context, TerminalError } from "@restatedev/restate-sdk";
import type { Queue } from "./queue";

export async function doWithQueue<T>(
  ctx: Context,
  priority: number,
  operation: () => Promise<T>,
): Promise<T> {
  const awakeable = ctx.awakeable();
  ctx.objectSendClient<Queue>({ name: "queue" }, "").tick({
    type: "push",
    item: {
      awakeable: awakeable.id,
      priority,
    },
  });

  await awakeable.promise;

  try {
    const result = await operation();

    ctx.objectSendClient<Queue>({ name: "queue" }, "").tick({
      type: "done",
    });

    return result;
  } catch (e) {
    if (e instanceof TerminalError) {
      ctx.objectSendClient<Queue>({ name: "queue" }, "").tick({
        type: "done",
      });
    }
    throw e;
  }
}
