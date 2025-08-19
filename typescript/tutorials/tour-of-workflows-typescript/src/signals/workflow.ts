import * as restate from "@restatedev/restate-sdk";
import { sendVerificationEmail, User } from "../utils";

export const signupWithSignals = restate.workflow({
  name: "signup-with-signals",
  handlers: {
    run: async (ctx: restate.WorkflowContext, user: User) => {
      const userId = ctx.key;

      // Generate verification secret and send email
      const secret = ctx.rand.uuidv4();
      await ctx.run("verify", () => sendVerificationEmail(userId, user, secret));

      // Wait for user to click verification link
      const clickedSecret = await ctx.promise<string>("email-verified");
      return { success: clickedSecret === secret };
    },
    verifyEmail: async (ctx: restate.WorkflowSharedContext, req: { secret: string }) => {
      // Resolve the promise to continue the main workflow
      await ctx.promise<string>("email-verified").resolve(req.secret);
    },
  },
});
