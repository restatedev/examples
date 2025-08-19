import * as restate from "@restatedev/restate-sdk";
import { sendVerificationEmail, callActivateUserAPI } from "../utils";

export const signupWithSignals = restate.workflow({
  name: "signup-with-signals",
  handlers: {
    run: async (
      ctx: restate.WorkflowContext,
      user: { name: string; email: string },
    ) => {
      const userId = ctx.key;

      // Generate verification secret and send email
      const verificationSecret = ctx.rand.uuidv4();
      await ctx.run(() => sendVerificationEmail(user, verificationSecret));

      // Wait for user to click verification link
      const clickedSecret = await ctx.promise<string>("email-verified");

      const success = clickedSecret === verificationSecret;
      if (!success) {
        return { success };
      }

      await ctx.run(() => callActivateUserAPI(userId));
      return { success };
    },
    verifyEmail: async (
      ctx: restate.WorkflowSharedContext,
      request: { secret: string },
    ) => {
      // Resolve the promise to continue the main workflow
      await ctx.promise<string>("email-verified").resolve(request.secret);
    },
  },
});
