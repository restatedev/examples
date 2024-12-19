import * as restate from "@restatedev/restate-sdk/fetch";
import {sendNotification, sendReminder} from "./utils";

const handler = restate
  .endpoint()
  .bind(
    restate.service({
      name: "Greeter",
      handlers: {
        greet: async (ctx: restate.Context, name: string) => {

            // Durably execute a set of steps; resilient against failures
          const greetingId = ctx.rand.uuidv4();
          await ctx.run(() => sendNotification(greetingId, name));
          await ctx.sleep(1000);
          await ctx.run(() => sendReminder(greetingId));

          // Respond to caller
          return `You said hi to ${name}!`;
        },
      },
    }),
  )
  .handler();

const server = Bun.serve({
  port: 9080,
  ...handler,
});

console.log(`Listening on ${server.url}`);
