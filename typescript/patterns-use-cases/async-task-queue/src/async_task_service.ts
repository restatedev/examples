// --------------- define async task logic as a service handler ---------------

import * as restate from "@restatedev/restate-sdk";
import { Context } from "@restatedev/restate-sdk";

const asyncTaskService = restate.service({
  name: "taskWorker",
  handlers: {
    runTask: async (ctx: Context, params: TaskOpts) => {
      return someHeavyWork(params);
    },
  },
});

export type AsyncTaskService = typeof asyncTaskService;

restate.endpoint().bind(asyncTaskService).listen(9080);


// ----------------------- Stubs to please the compiler -----------------------
export type TaskOpts = {id: string, task: string};

function someHeavyWork(work: TaskOpts) {
  return "Work!";
}
