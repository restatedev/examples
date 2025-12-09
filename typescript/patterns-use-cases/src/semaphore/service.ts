import { Context, service } from "@restatedev/restate-sdk";
import { limitHandler } from "./semaphore_client";

export const myService = service({
  name: "myService",
  handlers: {
    expensiveMethod: limitHandler(
      {
        id: "myService/expensiveMethod",
        concurrency: [
          {
            scope: "global",
            key: "openai-tokens",
            limit: 10,
          },
          {
            scope: "handler",
            key: (input) => `left:${input.left}`,
            limit: 3,
          },
          {
            scope: "handler",
            key: (input) => `right:${input.right}`,
            limit: 3,
          },
        ],
      },
      async (
        ctx: Context,
        params: { left: number; right: number }
      ): Promise<number> => {
        // very expensive - important that the semaphore protects this
        await ctx.sleep(5000 * ctx.rand.random());

        return params.left + params.right;
      }
    ),
  },
});

export type MyService = typeof myService;
