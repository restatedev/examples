import * as restate from "@restatedev/restate-sdk";
import {
  RestatePromise,
  TerminalError,
  WorkflowContext,
  WorkflowSharedContext,
} from "@restatedev/restate-sdk";
import { sendVerificationEmail, sendReminderEmail, User } from "../utils";

export const signupWithTimers = restate.workflow({
  name: "SignupWithTimersWorkflow",
  handlers: {
    run: async (ctx: WorkflowContext, user: User) => {
      const userId = ctx.key;

      const secret = ctx.rand.uuidv4();
      await ctx.run("verify", () =>
        sendVerificationEmail(userId, user, secret),
      );

      const clickedPromise = ctx.promise<string>("email-verified").get();
      const verificationTimeout = ctx.sleep({ days: 1 });
      while (true) {
        const reminderTimer = ctx.sleep({ seconds: 15 });

        // Wait for email verification, reminder timer or timeout
        const result = await RestatePromise.race([
          clickedPromise.map(() => "verified"),
          reminderTimer.map(() => "reminder"),
          verificationTimeout.map(() => "timeout"),
        ]);

        switch (result) {
          case "verified":
            const clickedSecret = await clickedPromise;
            return { success: clickedSecret === secret };
          case "reminder":
            await ctx.run("send reminder", () =>
              sendReminderEmail(userId, user, secret),
            );
            break;
          case "timeout":
            throw new TerminalError(
              "Email verification timed out after 24 hours",
            );
        }
      }
    },
    verifyEmail: async (
      ctx: WorkflowSharedContext,
      req: { secret: string },
    ) => {
      await ctx.promise<string>("email-verified").resolve(req.secret);
    },
  },
});
