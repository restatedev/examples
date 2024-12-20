import * as restate from "@restatedev/restate-sdk";
import { Context } from "@restatedev/restate-sdk";

const asyncTaskWorker = restate.service({
  name: "asyncTaskWorker",
  handlers: {
    runTask: async (ctx: Context, params: TaskOpts) => {
      return someHeavyWork(params);
    },
  },
});

export type AsyncTaskWorker = typeof asyncTaskWorker;

restate.endpoint().bind(asyncTaskWorker).listen(9080);


// ----------------------- Stubs to please the compiler -----------------------
export type TaskOpts = {id: string, task: string};

function someHeavyWork(work: TaskOpts) {
  return "Work!";
}
