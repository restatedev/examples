import * as restate from "@restatedev/restate-sdk";
import {
  createUserInDB,
  callActivateUserAPI,
  sendWelcomeEmail,
  User,
} from "../utils";

export const signupWithQueries = restate.workflow({
  name: "signup-with-queries",
  handlers: {
    run: async (ctx: restate.WorkflowContext, user: User) => {
      const userId = ctx.key;

      const success = await ctx.run("create", () => createUserInDB(user));
      if (!success) {
        ctx.set("status", "failed");
        return { success };
      }

      ctx.set("status", "created");
      await ctx.run("activate", () => callActivateUserAPI(userId));
      ctx.set("completed-at", await ctx.date.toJSON());
      ctx.set("status", "active");

      await ctx.run("welcome", () => sendWelcomeEmail(user));
      return { success };
    },

    getStatus: async (ctx: restate.WorkflowSharedContext) => {
      return await ctx.get("status");
    },
  },
});
