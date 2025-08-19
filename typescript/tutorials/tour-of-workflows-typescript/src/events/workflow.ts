import * as restate from "@restatedev/restate-sdk";
import {
  createUserInDB,
  callActivateUserAPI,
  sendWelcomeEmail,
  User,
} from "../utils";

export const signupWithEvents = restate.workflow({
  name: "signup-with-events",
  handlers: {
    run: async (ctx: restate.WorkflowContext, user: User) => {
      const userId = ctx.key;

      const success = await ctx.run("create", () => createUserInDB(user));
      if (!success) {
        await ctx.promise<string>("user-created").reject("Creation failed.");
        return { success };
      }
      await ctx.promise<string>("user-created").resolve("User created.");

      await ctx.run("activate", () => callActivateUserAPI(userId));
      await ctx.run("welcome", () => sendWelcomeEmail(user));
      return { success };
    },

    waitForUserCreation: async (ctx: restate.WorkflowSharedContext) => {
      return ctx.promise<string>("user-created");
    },
  },
});
