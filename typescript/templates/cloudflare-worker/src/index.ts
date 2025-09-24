import * as restate from "@restatedev/restate-sdk-cloudflare-workers/fetch";
import { serde } from "@restatedev/restate-sdk-zod";
import { sendNotification, sendReminder } from "./utils.js";

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
    greet: restate.createServiceHandler(
      { input: serde.zod(Greeting), output: serde.zod(GreetingResponse) },
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

export default {
    fetch: restate.createEndpointHandler({ services: [greeter] })
};
