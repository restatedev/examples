import * as restate from "@restatedev/restate-sdk";
import { iface, rand, run, sleep } from "@restatedev/restate-sdk-gen";
import { z } from "zod";

const Greeting = z.object({
  name: z.string(),
});

const GreetingResponse = z.object({
  result: z.string(),
});

const greeterApi = iface.service("Greeter", {
  greet: iface.schemas({ input: Greeting, output: GreetingResponse }),
});

const greeter = iface.implement(greeterApi, {
  handlers: {
    *greet({ name }) {
      // Durably execute a set of steps; resilient against failures
      const greetingId = rand().uuidv4();
      yield* run(async () => console.log(`Notification sent: ${greetingId}`), {
        name: "Notification",
      });
      yield* sleep({ seconds: 1 });
      yield* run(async () => console.log(`Reminder sent: ${greetingId}`), { name: "Reminder" });

      // Respond to caller
      return { result: `You said hi to ${name}!` };
    },
  },
});

restate.serve({ services: [greeter] });
