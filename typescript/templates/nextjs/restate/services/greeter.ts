import * as restate from "@restatedev/restate-sdk";
import { sendNotification, sendReminder } from "@/restate/services/utils";

export const greeter = restate.service({
  name: "Greeter",
  handlers: {
    greet: async (ctx: restate.Context, name: string) => {
      // Durably execute a set of steps; resilient against failures
      const greetingId = ctx.rand.uuidv4();
      await ctx.run("notification", () => sendNotification(greetingId, name));
      await ctx.sleep(1000);
      await ctx.run("reminder", () => sendReminder(greetingId));

      // Respond to caller
      return `You said hi to ${name}!`;
    },
  },
});

export type Greeter = typeof greeter;
