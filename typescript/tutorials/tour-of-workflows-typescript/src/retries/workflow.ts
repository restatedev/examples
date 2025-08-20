import * as restate from "@restatedev/restate-sdk";
import { WorkflowContext } from "@restatedev/restate-sdk";
import { activateUser, createUser, sendWelcomeEmail, User } from "../utils";

export const signupWithRetries = restate.workflow({
  name: "signup-with-retries",
  handlers: {
    run: async (ctx: WorkflowContext, user: User) => {
      const userId = ctx.key;

      const success = await ctx.run("create", () => createUser(userId, user));
      if (!success) return { success };

      await ctx.run("activate", () => activateUser(userId));

      // <start_retries>
      try {
        const retryPolicy = {
          maxRetryAttempts: 3,
          initialRetryIntervalMillis: 1000,
        };
        await ctx.run("welcome", () => sendWelcomeEmail(user), retryPolicy);
      } catch (error) {
        console.error("Failed to send welcome email after retries:", error);
      }
      // <end_retries>
      return { success };
    },
  },
});
