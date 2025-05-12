import * as restate from "@restatedev/restate-sdk";

export interface Message {
  data: string;
  base64Encoded?: boolean;
}

export interface SendMessage extends Message {
  compress?: boolean;
}

interface SocketState {}

const socket = restate.object({
  name: "socket",
  handlers: {
    receive: async (
      ctx: restate.ObjectContext<SocketState>,
      message: Message,
    ) => {
      ctx.console.log("Received websocket message:", message);

      // handle your websocket messages here
      // eg we can write an echo server:
      ctx
        .objectSendClient(Socket, ctx.key)
        .send({ data: `Reply: ${message.data}` });
    },
    send: async (
      ctx: restate.ObjectContext<SocketState>,
      message: SendMessage,
    ): Promise<number> => {
      const address = ctx.key;

      ctx.console.log(`Sending message to ${address}`);

      const result = await ctx.run("send message", async () => {
        const resp = await fetch(`${address}/messages`, {
          method: "POST",
          body: JSON.stringify(message),
        });

        if (resp.status == 404)
          throw new restate.TerminalError("Socket not found", {
            errorCode: 404,
          });

        if (!resp.ok) {
          throw new Error(`Failed to send message: status code ${resp.status}`);
        }

        const result: number = await resp.json();
        return result;
      });

      if (result === 2) {
        ctx.console.log(
          "Dropped websocket message due to backpressure:",
          message,
        );
      } else {
        ctx.console.log(`Sent websocket message (result ${result}):`, message);
      }

      return result;
    },
  },
});

export type Socket = typeof socket;
const Socket: Socket = { name: "socket" };

restate.endpoint().bind(socket).listen(9080);
