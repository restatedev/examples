import * as restate from "@restatedev/restate-sdk";
import { Context } from "@restatedev/restate-sdk";
import { bufferMessage } from "./util";
import type { Consumer } from "./consumer";

const Consumer: Consumer = { name: "consumer" };

export const producer = restate.service({
  name: "producer",
  handlers: {
    send: async (ctx: Context) => {
      bufferMessage(ctx, Consumer, "my-buffer-key", "my-test-message");
    },
  },
});
