import * as restate from "@restatedev/restate-sdk";
import { WorkflowContext, WorkflowSharedContext } from "@restatedev/restate-sdk";
import { createUser, activateUser, sendWelcomeEmail, User } from "../utils";

export const signupWithQueries = restate.workflow({
  name: "signup-with-queries",
  handlers: {
    run: async (ctx: WorkflowContext, user: User) => {
      const userId = ctx.key;

      ctx.set("user", user);
      const success = await ctx.run("create", () => createUser(userId, user));
      if (!success) {
        ctx.set("status", "failed");
        return { success };
      }
      ctx.set("status", "created");

      await ctx.run("activate", () => activateUser(userId));
      await ctx.run("welcome", () => sendWelcomeEmail(user));
      return { success };
    },

    getStatus: async (ctx: WorkflowSharedContext) => {
      return {
        status: await ctx.get("status"),
        user: await ctx.get("user"),
      };
    },
  },
});
