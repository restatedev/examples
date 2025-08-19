import * as restate from "@restatedev/restate-sdk";
import {
  callActivateUserAPI,
  createUserInDB,
  sendWelcomeEmail,
  User,
} from "../utils";

export const signupWorkflow = restate.workflow({
  name: "user-signup",
  handlers: {
    run: async (ctx: restate.WorkflowContext, user: User) => {
      const userId = ctx.key; // workflow ID = user ID

      const success = await ctx.run("create", () => createUserInDB(user));
      if (!success) return { success };

      await ctx.run("activate", () => callActivateUserAPI(userId));
      await ctx.run("welcome", () => sendWelcomeEmail(user));
      return { success };
    },
  },
});
