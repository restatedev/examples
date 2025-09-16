import * as restate from "@restatedev/restate-sdk";
import { WorkflowContext } from "@restatedev/restate-sdk";
import { activateUser, createUser, sendWelcomeEmail, User } from "../utils";

export const signupWithRetries = restate.workflow({
  name: "SignupWithRetriesWorkflow",
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
          initialRetryInterval: { seconds: 1 },
        };
        await ctx.run("welcome", () => sendWelcomeEmail(user), retryPolicy);
      } catch (error) {
        // This gets hit on retry exhaustion with a terminal error
        // Log and continue; without letting the workflow fail
        console.error("Failed to send welcome email after retries:", error);
      }
      // <end_retries>
      return { success };
    },
  },
});
