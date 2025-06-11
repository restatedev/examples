import * as restate from "@restatedev/restate-sdk";
import { serde } from "@restatedev/restate-sdk-zod";
import { sendNotification, sendReminder } from "./utils";

import { z } from "zod";

const Greeting = z.object({
  name: z.string(),
});

const GreetingResponse = z.object({
  result: z.string(),
});

const greeter = restate.service({
    name: "Greeter",
    handlers: {
      greet: restate.handlers.handler(
        { input: serde.zod(Greeting), output: serde.zod(GreetingResponse) },
        async (ctx: restate.Context, { name }) => {
          // Durably execute a set of steps; resilient against failures
          const greetingId = ctx.rand.uuidv4();
          await ctx.run("Notification", () => sendNotification(greetingId, name));
          await ctx.sleep(1000);
          await ctx.run("Reminder", () => sendReminder(greetingId, name));

          // Respond to caller
          return { result: `You said hi to ${name}!` };
        }
      ),
    },
  })

restate
  .endpoint()
  .bind(greeter)
  .listen(9080);
