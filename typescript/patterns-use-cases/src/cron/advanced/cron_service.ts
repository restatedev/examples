import * as restate from "@restatedev/restate-sdk";
import { CronExpressionParser } from "cron-parser";
import { taskService } from "./task_service";
import { serde } from "@restatedev/restate-sdk-clients";
import {InvocationId, TerminalError} from "@restatedev/restate-sdk";

type CronRequest = {
  expr: string; // The cron expression e.g. "0 0 * * *" (every day at midnight)
  service: string;
  handler: string; // Handler to execute with this schedule
  key?: string; // Optional: Virtual Object key to call
  payload?: any;
};

type CronJob = {
  req: CronRequest;
  next_execution_time?: string; // The next execution time of the cron job
  next_execution_id?: InvocationId; // The ID of the next execution invocation
};

/*
First look at the simple cron service example to understand the basic concepts.

This advanced example builds on the simple cron service and adds the ability to cancel jobs and retrieve job information.
The service allows you to create a cron job that can be started, executed, and canceled.
It also provides a way to retrieve information about the job, such as the next execution time and the ID of the next execution invocation.

Restate acts as the resilient scheduler.
*/

const cronService = restate.service({
  name: "CronService",
  handlers: {
    create: async (ctx: restate.Context, req: CronRequest) => {
      // Creates a job ID and waits for successful initiation of the job
      const jobId = ctx.rand.uuidv4();
      await ctx.objectClient(cronJob, jobId).initiateJob(req);
      return "Cron job created with ID: " + jobId;
    },
  },
});

const cronJob = restate.object({
  name: "CronJob",
  handlers: {
    initiateJob: async (ctx: restate.ObjectContext, req: CronRequest) => {
      // Check if the job already exists
        const existingJob = await ctx.get<CronJob>("job");
        if (existingJob) {
          throw new TerminalError("Job already exists. Use a different ID or cancel the existing job first.");
        }

      // starting the cron job the first time
      await scheduleNext(ctx, req);
    },
    execute: async (ctx: restate.ObjectContext, req: CronRequest) => {
      // execute the handler
      ctx.genericSend({
        service: req.service,
        method: req.handler,
        key: req.key,
        parameter: req.payload,
        inputSerde: req.payload ? serde.json : serde.empty,
      });

      // schedule the next execution
      await scheduleNext(ctx, req);
    },
    cancel: async (ctx: restate.ObjectContext) => {
      // Cancel the cron job by canceling the next execution
      const jobInfo = await ctx.get<CronJob>("job");
      if (jobInfo && jobInfo.next_execution_id) {
        ctx.cancel(jobInfo.next_execution_id);
      }
      ctx.clearAll();
    },
    getInfo: async (ctx: restate.ObjectSharedContext) =>
      ctx.get<CronJob>("job"),
  },
});

restate
  .endpoint()
  .bind(cronService)
  .bind(cronJob)
  .bind(taskService)
  .listen(9080);


const scheduleNext = async (ctx: restate.ObjectContext, req: CronRequest) => {
  // Parse the cron expression to determine the next execution time
  let interval ;
  try {
    interval = CronExpressionParser.parse(req.expr);
  } catch (e) {
    throw new TerminalError(`Invalid cron expression: ${(e as Error).message}`)
  }
  const next = interval.next().toDate();
  const delay = next.getTime() - Date.now();

  // Schedule the next execution of the task
  const handle = ctx
      .objectSendClient(cronJob, ctx.key, { delay: delay })
      .execute(req);

  // Store the job information in the Restate for later retrieval
  ctx.set<CronJob>("job", {
    req,
    next_execution_time: next.toString(),
    next_execution_id: await handle.invocationId,
  });
};