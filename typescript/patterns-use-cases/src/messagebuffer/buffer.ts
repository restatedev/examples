import * as restate from "@restatedev/restate-sdk";
import { ObjectContext } from "@restatedev/restate-sdk";

export interface Notification {
  bufferKey: string;
}

interface BufferState {
  messages: unknown[];
}

export type AddMessage = {
  message: unknown;
  notify: {
    service: string;
    method: string;
    key?: string;
  };
};

export const buffer = restate.object({
  name: "buffer",
  handlers: {
    add: async (ctx: ObjectContext<BufferState>, req: AddMessage) => {
      const messages = (await ctx.get("messages")) ?? [];
      messages.push(req.message);

      ctx.set("messages", messages);

      if (messages.length == 1) {
        // we only need to notify for the first message
        ctx.genericSend<Notification>({
          service: req.notify.service,
          method: req.notify.method,
          key: req.notify.key,
          inputSerde: restate.serde.json,
          parameter: { bufferKey: ctx.key },
        });
      }
    },
    drain: async (ctx: ObjectContext<BufferState>): Promise<unknown[]> => {
      const messages = (await ctx.get("messages")) ?? [];
      ctx.clear("messages");
      return messages;
    },
  },
});
export type Buffer = typeof buffer;
