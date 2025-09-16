import * as restate from "@restatedev/restate-sdk";
import {
  WorkflowContext,
  WorkflowSharedContext,
} from "@restatedev/restate-sdk";
import { createUser, activateUser, sendWelcomeEmail, User } from "../utils";

export const signupWithEvents = restate.workflow({
  name: "SignupWithEventsWorkflow",
  handlers: {
    run: async (ctx: WorkflowContext, user: User) => {
      const userId = ctx.key;

      const success = await ctx.run("create", () => createUser(userId, user));
      if (!success) {
        await ctx.promise<string>("user-created").reject("Creation failed.");
        return { success };
      }
      await ctx.promise<string>("user-created").resolve("User created.");

      await ctx.run("activate", () => activateUser(userId));
      await ctx.run("welcome", () => sendWelcomeEmail(user));
      return { success };
    },

    waitForUserCreation: async (ctx: WorkflowSharedContext) => {
      return ctx.promise<string>("user-created");
    },
  },
});
