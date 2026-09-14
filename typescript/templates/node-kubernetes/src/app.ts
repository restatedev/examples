import * as restate from "@restatedev/restate-sdk";
import { sendNotification, sendReminder } from "./utils";

import { z } from "zod";
import { connectTunnel } from "@restatedev/restate-sdk-tunnel";

const Greeting = z.object({
  name: z.string().default("World"),
});

const GreetingResponse = z.object({
  result: z.string(),
});

const greeter = restate.service({
  name: "Greeter",
  handlers: {
    greet: restate.createServiceHandler(
      { input: restate.serde.schema(Greeting), output: restate.serde.schema(GreetingResponse) },
      async (ctx: restate.Context, { name }) => {
        // Durably execute a set of steps; resilient against failures
        const greetingId = ctx.rand.uuidv4();
        await ctx.run("Notification", () => sendNotification(greetingId, name));
        await ctx.sleep({ seconds: 1 });
        await ctx.run("Reminder", () => sendReminder(greetingId, name));

        // Respond to caller
        return { result: `You said hi to ${name}!` };
      },
    ),
  },
});

connectTunnel({ services: [greeter] });
