import * as restate from "@restatedev/restate-sdk";
import { ObjectContext } from "@restatedev/restate-sdk";
import type { Buffer, Notification } from "./buffer";

export const consumer = restate.object({
  name: "consumer",
  handlers: {
    bufferNotify: async (ctx: ObjectContext, req: Notification) => {
      const messages = await ctx
        .objectClient<Buffer>({ name: "buffer" }, req.bufferKey)
        .drain();
      if (messages.length == 0) return;

      console.log(`Read ${messages.length} messages from the buffer object`);

      // do your work with the messages...
      // (we sleep to simulate a busy VO)
      await ctx.sleep(10_000);

      console.log(`Finished processing ${messages.length} messages`);

      return;
    },
  },
});
export type Consumer = typeof consumer;
