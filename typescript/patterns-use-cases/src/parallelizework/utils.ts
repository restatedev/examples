import { Context } from "@restatedev/restate-sdk";

export interface Task {
  description: string;
}

export interface SubTask {
  description: string;
}

export interface SubTaskResult {
  description: string;
}

export interface Result {
  description: string;
}

export function split(task: Task): SubTask[] {
  // Split the task into subTasks
  const subtaskDescriptions = task.description.split(",");

  const subTasks: SubTask[] = [];
  for (const description of subtaskDescriptions) {
    subTasks.push({ description } as SubTask);
  }

  return subTasks;
}

export async function executeSubtask(ctx: Context, subtask: SubTask): Promise<SubTaskResult> {
  // Execute subtask
  ctx.console.info(`Started executing subtask: ${subtask.description}`);
  // Sleep for a random amount between 0 and 10 seconds
  await ctx.sleep(Math.floor(ctx.rand.random() * 5) * 1000);
  ctx.console.info(`Execution subtask finished: ${subtask.description}`);
  return { description: `${subtask.description}: DONE` };
}

export function aggregate(ctx: Context, subResults: SubTaskResult[]): Result {
  // Aggregate the results
  const descriptions = subResults.map((subResult) => subResult.description);
  const resultDescription = descriptions.join(",");
  ctx.console.info(`Aggregated result: ${resultDescription}`);
  return { description: resultDescription };
}
