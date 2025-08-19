import * as restate from "@restatedev/restate-sdk";
import { RestatePromise } from "@restatedev/restate-sdk";
import { sendVerificationEmail, sendReminderEmail } from "../utils";

export const signupWithTimers = restate.workflow({
  name: "signup-with-timers",
  handlers: {
    run: async (
      ctx: restate.WorkflowContext,
      user: { name: string; email: string },
    ) => {
      const verificationSecret = ctx.rand.uuidv4();
      await ctx.run("verify", () => sendVerificationEmail(user, verificationSecret));

      const verificationTimeout = ctx.sleep({ days: 1 });

      while (true) {
        const reminderTimer = ctx.sleep({ hours: 4 });

        // Wait for either email verification, reminder timeout, or verification timeout
        const result = await RestatePromise.race([
          ctx
            .promise<string>("email-verified")
            .get()
            .map(() => "verified"),
          reminderTimer.map(() => "reminder"),
          verificationTimeout.map(() => "timeout"),
        ]);

        switch (result) {
          case "verified":
            const clickedSecret = await ctx.promise<string>("email-verified");
            return { success: clickedSecret === verificationSecret };
          case "reminder":
            await ctx.run("remind", () => sendReminderEmail(user, verificationSecret));
            break;

          case "timeout":
            throw new restate.TerminalError(
              "Email verification timed out after 24 hours",
            );
        }
      }
    },
    verifyEmail: async (
      ctx: restate.WorkflowSharedContext,
      request: { secret: string },
    ) => {
      // Resolve the promise to continue the main workflow
      await ctx.promise<string>("email-verified").resolve(request.secret);
    },
  },
  options: {journalRetention: {hours: 4}}
});
