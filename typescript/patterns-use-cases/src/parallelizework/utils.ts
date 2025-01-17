import { Context } from "@restatedev/restate-sdk";

export interface Task {
  Description: string;
}

export interface SubTask {
  Description: string;
}

export interface SubTaskResult {
  Description: string;
}

export interface Result {
  Description: string;
}

export function split(task: Task): SubTask[] {
  // Split the task into subTasks
  const subtaskDescriptions = task.Description.split(",");

  const subTasks: SubTask[] = [];
  for (const description of subtaskDescriptions) {
    subTasks.push({ Description: description });
  }

  return subTasks;
}

export async function executeSubtask(ctx: Context, subtask: SubTask): Promise<SubTaskResult> {
  // Execute subtask
  console.log(`Started executing subtask: ${subtask.Description}`);
  // Sleep for a random amount between 0 and 10 seconds
  await ctx.sleep(Math.floor(ctx.rand.random() * 5) * 1000);
  console.log(`Execution subtask finished: ${subtask.Description}`);
  return { Description: `${subtask.Description}: DONE` };
}

export function aggregate(subResults: SubTaskResult[]): Result {
  // Aggregate the results
  const descriptions = subResults.map(subResult => subResult.Description);
  const resultDescription = descriptions.join(",");
  console.log(`Aggregated result: ${resultDescription}`);
  return { Description: resultDescription };
}