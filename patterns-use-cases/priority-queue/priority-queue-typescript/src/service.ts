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

import { Context, service } from "@restatedev/restate-sdk";
import { doWithQueue } from "./queue_client";

export const myService = service({
  name: "myService",
  handlers: {
    expensiveMethod: async (
      ctx: Context,
      params: { left: number; right: number },
    ): Promise<number> => {
      return doWithQueue(ctx, 1, () =>
        ctx.run(() => expensiveOperation(params.left, params.right)),
      );
    },
  },
});

async function expensiveOperation(
  left: number,
  right: number,
): Promise<number> {
  await new Promise((resolve) => setTimeout(resolve, 5_000));

  // very cpu heavy - important that the queue protects this
  return left + right;
}

export type MyService = typeof myService;
