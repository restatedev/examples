
export type Task = {};

export type Result = {};


export type SubTask = {};

export type SubTaskResult = void;

export async function split(task: Task): Promise<SubTask[]> {
  return [];
}

export async function aggregate(packages: SubTaskResult[]): Promise<Result> {
  return {};
}