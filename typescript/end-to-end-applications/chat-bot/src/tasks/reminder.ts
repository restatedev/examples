import * as restate from "@restatedev/restate-sdk";
import { TaskSpec, TaskWorkflow } from "../taskmanager";

// ----------------------------------------------------------------------------
//  The task workflow for a simple reminder.
// ----------------------------------------------------------------------------

type ReminderOpts = {
  timestamp: number;
  description?: string;
};

const reminderSvc = restate.workflow({
  name: "reminderWorkflow",
  handlers: {
    run: async (ctx: restate.WorkflowContext, opts: ReminderOpts) => {
      ctx.set("timestamp", opts.timestamp);

      const delay = opts.timestamp - (await ctx.date.now());
      const sleep = ctx.sleep(delay);

      const cancelled = ctx.promise<boolean>("cancelled");

      await restate.RestatePromise.race([sleep, cancelled.get()]);
      if (await cancelled.peek()) {
        return "The reminder has been cancelled";
      }

      return `It is time${opts.description ? ": " + opts.description : "!"}`;
    },

    cancel: async (ctx: restate.WorkflowSharedContext) => {
      ctx.promise<boolean>("cancelled").resolve(true);
    },

    currentStatus: async (ctx: restate.WorkflowSharedContext) => {
      const timestamp = await ctx.get<number>("timestamp");
      if (!timestamp) {
        return { remainingTime: -1 };
      }
      const timeRemaining = timestamp - Date.now().valueOf();
      return { remainingTime: timeRemaining > 0 ? timeRemaining : 0 };
    },
  } satisfies TaskWorkflow<ReminderOpts>,
});

function paramsParser(name: string, params: any): ReminderOpts {
  const dateString = params.date;
  if (typeof dateString !== "string") {
    throw new Error("Missing string field 'date' in parameters for task type 'reminder'");
  }
  const date = new Date(dateString);

  const description = typeof params.description === "string" ? params.description : undefined;

  return { timestamp: date.valueOf(), description };
}

export const reminderTaskDefinition: TaskSpec<ReminderOpts> = {
  paramsParser,
  taskTypeName: "reminder",
  taskWorkflow: reminderSvc,
};

if (require.main === module) {
  restate.endpoint().bind(reminderSvc).listen(9081);
}
