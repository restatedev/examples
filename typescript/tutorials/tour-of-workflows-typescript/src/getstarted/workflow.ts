import * as restate from "@restatedev/restate-sdk";
import { WorkflowContext } from "@restatedev/restate-sdk";
import { activateUser, createUser, sendWelcomeEmail, User } from "../utils";

export const signupWorkflow = restate.workflow({
  name: "user-signup",
  handlers: {
    run: async (ctx: WorkflowContext, user: User) => {
      const userId = ctx.key; // workflow ID = user ID

      const success = await ctx.run("create", () => createUser(userId, user));
      if (!success) return { success };

      await ctx.run("activate", () => activateUser(userId));
      await ctx.run("welcome", () => sendWelcomeEmail(user));
      return { success };
    },
  },
});
