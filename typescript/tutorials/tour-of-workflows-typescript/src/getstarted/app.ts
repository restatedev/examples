import * as restate from "@restatedev/restate-sdk";
import {
  callActivateUserAPI,
  createUserInDB,
  sendWelcomeEmail,
} from "../utils";

export const signupWorkflow = restate.workflow({
  name: "user-signup",
  handlers: {
    run: async (
      ctx: restate.WorkflowContext,
      user: { name: string; email: string },
    ) => {
      // workflow ID = user ID; workflow runs once per user
      const userId = ctx.key;

      const success = await ctx.run("create", () => createUserInDB(user));

      if (!success) {
        return { success };
      }

      await ctx.run("activate", () => callActivateUserAPI(userId));
      await ctx.run("welcome", () => sendWelcomeEmail(user));
      return { success };
    },
  },
  options: {journalRetention: {hours: 4}}
});
