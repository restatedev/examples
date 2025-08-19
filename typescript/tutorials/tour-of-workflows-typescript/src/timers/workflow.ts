import * as restate from "@restatedev/restate-sdk";
import {RestatePromise, TerminalError} from "@restatedev/restate-sdk";
import { sendVerificationEmail, sendReminderEmail, User } from "../utils";

export const signupWithTimers = restate.workflow({
  name: "signup-with-timers",
  handlers: {
    run: async (ctx: restate.WorkflowContext, user: User) => {
      const userId = ctx.key;

      const secret = ctx.rand.uuidv4();
      await ctx.run("verify", () => sendVerificationEmail(userId, user, secret));

      const clickedPromise = ctx.promise<string>("email-verified").get();
      const verificationTimeout = ctx.sleep({ days: 1 });
      while (true) {
        const reminderTimer = ctx.sleep({ seconds: 15 });

        // Wait for either email verification, reminder timeout, or verification timeout
        const result = await RestatePromise.race([
          clickedPromise.map(() => "verified"),
          reminderTimer.map(() => "reminder"),
          verificationTimeout.map(() => "timeout"),
        ]);

        switch (result) {
          case "verified":
            const clickedSecret = await ctx.promise<string>("email-verified");
            return { success: clickedSecret === secret };
          case "reminder":
            await ctx.run("remind", () => sendReminderEmail(user));
            break;
          case "timeout":
            throw new TerminalError("Email verification timed out after 24 hours");
        }
      }
    },
    verifyEmail: async (ctx: restate.WorkflowSharedContext, request: { secret: string }) => {
      // Resolve the promise to continue the main workflow
      await ctx.promise<string>("email-verified").resolve(request.secret);
    },
  },
});
