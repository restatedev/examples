import * as restate from "@restatedev/restate-sdk";
import {
  callActivateUserAPI,
  createUserInDB,
  sendWelcomeEmail,
  User,
} from "../utils";

export const signupWithRetries = restate.workflow({
  name: "signup-with-retries",
  handlers: {
    run: async (ctx: restate.WorkflowContext, user: User) => {
      const userId = ctx.key;

      const success = await ctx.run("create", () => createUserInDB(user));
      if (!success) return { success };

      await ctx.run("activate", () => callActivateUserAPI(userId));

      // <start_retries>
      try {
        // Define a retry policy for sending the welcome email
        const policy = {
          maxRetryAttempts: 3,
          initialRetryIntervalMillis: 1000,
        };
        await ctx.run("welcome", () => sendWelcomeEmail(user), policy);
      } catch (error) {
        console.error("Failed to send welcome email after retries:", error);
      }
      // <end_retries>
      return { success };
    },
  },
});
