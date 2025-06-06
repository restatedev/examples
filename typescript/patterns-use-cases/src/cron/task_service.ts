import * as restate from "@restatedev/restate-sdk";
import {cronJob, cronJobInitiator} from "./cron_service";

export const taskService = restate.service({
  name: "TaskService",
  handlers: {
    // This is a task stub to be able to demo the cron service.
    executeTask: async (ctx: restate.Context, task: string) => {
      console.log(`Executing task: ${task}`);
      // Here you would implement the logic to execute the task
      // For example, you could call another service or perform some computation
    },
  },
});


restate
    .endpoint()
    .bind(cronJobInitiator)
    .bind(cronJob)
    .bind(taskService)
    .listen(9080);