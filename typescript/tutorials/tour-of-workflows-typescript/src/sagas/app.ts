import * as restate from "@restatedev/restate-sdk";
import {
  callActivateUserAPI,
  callDeactivateUserAPI,
  cancelSubscription,
  createUserInDB,
  deleteUserInDB,
  subscribeToPaidPlan,
} from "../utils";

export const signupWithSagas = restate.workflow({
  name: "signup-with-sagas",
  handlers: {
    run: async (
      ctx: restate.WorkflowContext,
      user: { name: string; email: string },
    ) => {
      const userId = ctx.key;
      const compensations = [];

      try {
        compensations.push(() => ctx.run("delete", () => deleteUserInDB(user)));
        await ctx.run("create", () => createUserInDB(user));

        compensations.push(() =>
          ctx.run("deactivate", () => callDeactivateUserAPI(userId)),
        );
        await ctx.run("activate", () => callActivateUserAPI(userId));

        compensations.push(() =>
          ctx.run("unsubscribe", () => cancelSubscription(user)),
        );
        await ctx.run("subscribe", () => subscribeToPaidPlan(user));
      } catch (e) {
        if (e instanceof restate.TerminalError) {
          for (const compensation of compensations.reverse()) {
            await compensation();
          }
        }
        return { success: false };
      }
      return { success: true };
    },
  },
});
