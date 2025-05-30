import * as restate from "@restatedev/restate-sdk";

export const taskService = restate.service({
  name: "TaskService",
  handlers: {
    // This handler is called by the scheduler to execute a task
    executeTask: async (ctx: restate.Context, task: string) => {
      console.log(`Executing task: ${task}`);
      // Here you would implement the logic to execute the task
      // For example, you could call another service or perform some computation
    },
  },
});
