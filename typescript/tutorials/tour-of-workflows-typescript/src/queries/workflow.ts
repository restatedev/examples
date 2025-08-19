import * as restate from "@restatedev/restate-sdk";
import {
  createUserInDB,
  callActivateUserAPI,
  sendWelcomeEmail,
} from "../utils";

export const signupWithQueries = restate.workflow({
  name: "signup-with-queries",
  handlers: {
    run: async (
      ctx: restate.WorkflowContext,
      user: { name: string; email: string },
    ) => {
      const userId = ctx.key;

      const success = await ctx.run("create", () => createUserInDB(user));

      if (!success) {
        ctx.set("status", { status: "verification-failed", user });
        return { success };
      }

      ctx.set("status", { status: "user-created", user });
      await ctx.run("activate", () => callActivateUserAPI(userId));
      ctx.set("status", {
        status: "user-activated",
        user,
        completedAt: new Date().toISOString(),
      });
      await ctx.run("welcome", () => sendWelcomeEmail(user));
      return { success };
    },

    getStatus: async (ctx: restate.WorkflowSharedContext) => {
      return await ctx.get("status");
    },
  },
  options: {journalRetention: {hours: 4}}
});
