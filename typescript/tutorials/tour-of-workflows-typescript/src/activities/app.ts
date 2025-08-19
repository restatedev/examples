import * as restate from "@restatedev/restate-sdk";
import { callActivateUserAPI, sendWelcomeEmail, userService } from "../utils";

export const signupWithActivities = restate.workflow({
  name: "signup-with-activities",
  handlers: {
    run: async (
      ctx: restate.WorkflowContext,
      user: { name: string; email: string },
    ) => {
      const userId = ctx.key;

      // Move user DB interaction to dedicated service
      const success = await ctx
        .serviceClient(userService)
        .createUser({ id: ctx.key, ...user });

      if (!success) {
        return { success };
      }

      await ctx.run(() => callActivateUserAPI(userId));
      await ctx.run(() => sendWelcomeEmail(user));
      return { success };
    },
  },
});
