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
