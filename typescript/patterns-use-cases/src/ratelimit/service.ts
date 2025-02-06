import { Context, service } from "@restatedev/restate-sdk";
import { Limiter } from "./limiter_client";

const LIMITER_NAME = "myService-expensiveMethod";

export const myService = service({
  name: "myService",
  handlers: {
    expensiveMethod: async (ctx: Context) => {
      const limiter = Limiter.fromContext(ctx, LIMITER_NAME);
      await limiter.wait();
      console.log("expensive!");
    },
    expensiveMethodBatch: async (ctx: Context, batchSize: number = 20) => {
      const limiter = Limiter.fromContext(ctx, LIMITER_NAME);
      await limiter.wait(batchSize);
      for (let i = 0; i < batchSize; i++) {
        console.log("expensive!");
      }
    },
  },
});

export type MyService = typeof myService;
