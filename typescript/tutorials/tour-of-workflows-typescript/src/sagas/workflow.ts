import * as restate from "@restatedev/restate-sdk";
import { WorkflowContext } from "@restatedev/restate-sdk";
import {
  activateUser,
  deactivateUser,
  cancelSubscription,
  createUser,
  deleteUser,
  subscribeToPaidPlan,
  User,
} from "../utils";

export const signupWithSagas = restate.workflow({
  name: "signup-with-sagas",
  handlers: {
    run: async (ctx: WorkflowContext, user: User) => {
      const userId = ctx.key;
      const compensations = [];

      try {
        compensations.push(() => ctx.run("delete", () => deleteUser(userId)));
        await ctx.run("create", () => createUser(userId, user));

        compensations.push(() =>
          ctx.run("deactivate", () => deactivateUser(userId)),
        );
        await ctx.run("activate", () => activateUser(userId));

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
