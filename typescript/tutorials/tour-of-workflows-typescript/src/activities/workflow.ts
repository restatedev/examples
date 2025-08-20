import * as restate from "@restatedev/restate-sdk";
import { WorkflowContext } from "@restatedev/restate-sdk";
import { activateUser, sendWelcomeEmail, userService, User } from "../utils";

export const signupWithActivities = restate.workflow({
  name: "signup-with-activities",
  handlers: {
    run: async (ctx: WorkflowContext, user: User) => {
      const userId = ctx.key;

      // <start_activities>
      // Move user DB interaction to dedicated service
      const success = await ctx
        .serviceClient(userService)
        .createUser({ userId, user });
      if (!success) return { success };

      // Execute other steps inline
      await ctx.run("activate", () => activateUser(userId));
      await ctx.run("welcome", () => sendWelcomeEmail(user));
      // <end_activities>
      return { success };
    },
  },
});
