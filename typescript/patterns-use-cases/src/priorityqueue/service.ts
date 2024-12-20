import { Context, service } from "@restatedev/restate-sdk";
import { Queue } from "./queue_client";

const QUEUE_NAME = "myService/expensiveMethod";

export const myService = service({
  name: "myService",
  handlers: {
    expensiveMethod: async (
      ctx: Context,
      params: { left: number; right: number; priority?: number },
    ): Promise<number> => {
      const queue = Queue.fromContext(ctx, QUEUE_NAME);
      return queue.run(params.priority ?? 1, () =>
        expensiveOperation(ctx, params.left, params.right),
      );
    },
  },
});

async function expensiveOperation(
  ctx: Context,
  left: number,
  right: number,
): Promise<number> {
  return ctx.run(async () => {
    // very cpu heavy - important that the queue protects this
    await new Promise((resolve) => setTimeout(resolve, 5_000));
    return left + right;
  });
}

export type MyService = typeof myService;
