import * as restate from "@restatedev/restate-sdk"
import type { ChatSession } from "./chat"

// ----------------------------------------------------------------------------
//  The Task Manager has the map of available task workflows.
//  It maintains the mapping from task_type (name of the task type) to the
//  implementing workflow service, and has the utilities to start, cancel,
//  and query them.
// ----------------------------------------------------------------------------

// ------------------ defining new types of task workflows --------------------

export type TaskWorkflow<P = unknown> = {

    run: (ctx: restate.WorkflowContext, params: P) => Promise<string>

    cancel: (ctx: restate.WorkflowSharedContext) => Promise<void>,

    currentStatus: (ctx: restate.WorkflowSharedContext) => Promise<unknown>
}

export type TaskSpec<P> = {
    taskTypeName: string,
    taskWorkflow: restate.WorkflowDefinition<string, TaskWorkflow<P>>,
    paramsParser: (taskName: string, params: object) => P,
}

export function registerTaskWorkflow<P>(task: TaskSpec<P>) {
    availableTaskTypes.set(task.taskTypeName, task);   
}

const availableTaskTypes: Map<string, TaskSpec<unknown>> = new Map();

// ----------------- start / cancel / query task workflows --------------------

export type TaskOpts = {
    name: string,
    workflowName: string,
    params: object
}

export type TaskResult = { taskName: string, result: string }

export async function startTask<P = unknown>(
        ctx: restate.Context,
        channelForResult: string,
        taskOps: TaskOpts): Promise<string> {

    const task = availableTaskTypes.get(taskOps.workflowName) as TaskSpec<P> | undefined;
    if (!task) {
        throw new Error("Unknown task type: " + taskOps.workflowName);
    }

    const workflowParams = task.paramsParser(taskOps.name, taskOps.params)
    const workflowId = ctx.rand.uuidv4();

    ctx.serviceSendClient(workflowInvoker).invoke({
            taskName: taskOps.name,
            workflowServiceName: task.taskWorkflow.name,
            workflowParams,
            workflowId,
            channelForResult
        });
    
    return workflowId;
}

export async function cancelTask(
        ctx: restate.Context,
        workflowName: string,
        workflowId: string): Promise<void> {

    const task = availableTaskTypes.get(workflowName);
    if (!task) {
        throw new Error("Unknown task type: " + workflowName);
    }

    await ctx.workflowClient(task.taskWorkflow, workflowId).cancel();
}

export async function getTaskStatus(
        ctx: restate.Context,
        workflowName: string,
        workflowId: string): Promise<unknown> {

    const task = availableTaskTypes.get(workflowName);
    if (!task) {
        throw new Error("Unknown task type: " + workflowName);
    }

    const response = ctx.workflowClient(task.taskWorkflow, workflowId).currentStatus();
    return response;
}


// ----------------------------------------------------------------------------
//  Utility durable function that awaits the workflow result and forwards
//  it to the chat session
// ----------------------------------------------------------------------------

export const workflowInvoker = restate.service({
    name: "workflowInvoker",
    handlers: {
        invoke: async (
                ctx: restate.Context,
                opts: {
                    workflowServiceName: string,
                    workflowId: string,
                    workflowParams: unknown,
                    taskName: string,
                    channelForResult: string
                }) => {

            const taskWorkflowApi: restate.WorkflowDefinition<string, TaskWorkflow<unknown>> = { name: opts.workflowServiceName };
            let response: TaskResult;
            try {
                const result = await ctx.workflowClient(taskWorkflowApi, opts.workflowId).run(opts.workflowParams);
                response = { taskName: opts.taskName, result };
            } catch (err: any) {
                response = { taskName: opts.taskName, result: "Task failed: " +err.message }
            }

            ctx.objectSendClient<ChatSession>({ name: "chatSession" }, opts.channelForResult)
                .taskDone(response);
        }
    }
})
