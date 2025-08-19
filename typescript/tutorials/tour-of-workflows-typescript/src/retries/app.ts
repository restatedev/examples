import * as restate from "@restatedev/restate-sdk";
import {callActivateUserAPI, callDeactivateUserAPI, createUserInDB, deleteUserInDB, sendWelcomeEmail} from "../utils";

export const signupWithRetries = restate.workflow({
  name: "signup-with-retries",
  handlers: {
    run: async (
      ctx: restate.WorkflowContext,
      user: { name: string; email: string },
    ) => {
      const userId = ctx.key;

      const success = await ctx.run("create", () => createUserInDB(user));

      if(!success){
        return { success }
      }

      await ctx.run("activate", () => callActivateUserAPI(userId))

      try {
        // Don't let the workflow get stuck if the email service is down
        const emailRetryPolicy = {
          maxRetryAttempts: 3,
          maxRetryInterval: { seconds: 10 },
        };
        await ctx.run("welcome", () => sendWelcomeEmail(user), emailRetryPolicy);
      } catch (error) {
        console.error("Failed to send welcome email after retries:", error);
        return { success: true };
      }
      return { success };
    },
  },
});
