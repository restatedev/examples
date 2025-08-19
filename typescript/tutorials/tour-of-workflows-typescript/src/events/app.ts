import * as restate from "@restatedev/restate-sdk";
import {
  emailService,
  userService,
  createUserInDB,
  sendVerificationEmail,
  callActivateUserAPI, sendWelcomeEmail,
} from "../utils";

export const signupWithEvents = restate.workflow({
  name: "signup-with-events",
  handlers: {
    run: async (
      ctx: restate.WorkflowContext,
      user: { name: string; email: string },
    ) => {
      const userId = ctx.key;

      const success = await ctx.run(() => createUserInDB(user));

      if(!success){
        await ctx.promise<string>("user-created").reject("User couldn't be created.");
        return { success }
      }

      await ctx.promise<string>("user-created").resolve("User created.");
      await ctx.run(() => callActivateUserAPI(userId))
      await ctx.promise<boolean>("user-activated").resolve(true);
      await ctx.run(() => sendWelcomeEmail(user));
      return { success }
    },

    waitForUserCreation: async (ctx: restate.WorkflowSharedContext) => {
      return ctx.promise<string>("user-created");
    },

    waitForUserActivation: async (ctx: restate.WorkflowSharedContext) => {
      return ctx.promise<boolean>("user-activated");
    },
  },
});
