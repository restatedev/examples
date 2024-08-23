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
import type { Queue as QueueObject } from "./queue";

export interface Queue {
  run<T>(priority: number, op: () => Promise<T>): Promise<T>;
}

export namespace Queue {
  export function fromContext(ctx: Context, name: string): Queue {
    return {
      async run<T>(priority: number, op: () => Promise<T>): Promise<T> {
        const client = ctx.objectSendClient<QueueObject>(
          { name: "queue" },
          name,
        );

        const awakeable = ctx.awakeable();
        client.push({
          awakeable: awakeable.id,
          priority,
        });

        try {
          await awakeable.promise;
        } catch (e) {
          if (e instanceof TerminalError) {
            // this should only happen on cancellation; inform the queue that we no longer need to be scheduled
            client.drop(awakeable.id);
          }
          throw e;
        }

        try {
          const result = await op();

          client.done();

          return result;
        } catch (e) {
          if (e instanceof TerminalError) {
            client.done();
          }
          throw e;
        }
      },
    };
  }
}
