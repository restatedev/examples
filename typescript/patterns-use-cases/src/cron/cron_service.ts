import * as restate from "@restatedev/restate-sdk";
import { CronExpressionParser } from "cron-parser";
import { taskService } from "./task_service";
import { serde } from "@restatedev/restate-sdk-clients";
import { InvocationId, TerminalError } from "@restatedev/restate-sdk";

type CronRequest = {
  expr: string; // The cron expression e.g. "0 0 * * *" (every day at midnight)
  service: string;
  method: string; // Handler to execute with this schedule
  key?: string; // Optional: Virtual Object key to call
  parameter?: any; // Optional payload to pass to the handler
};

type CronJobSpec = {
  req: CronRequest;
  next_execution_time: string;
  next_execution_id: InvocationId;
};

const JOB = "job"; // Key for storing job information in the Restate object

/**
 * A distributed cron service built with Restate that schedules tasks based on cron expressions.
 *
 * Features:
 * - Create cron jobs with standard cron expressions (e.g., "0 0 * * *" for daily at midnight)
 * - Schedule any Restate service handler or virtual object method
 * - Guaranteed execution with Restate's durability
 * - Cancel and inspect running jobs
 *
 * Usage:
 * 1. Send requests to CronInitiator.create() to start new jobs
 * 2. Each job gets a unique ID and runs as a CronJob virtual object
 * 3. Jobs automatically reschedule themselves after each execution
 */
const cronJobInitiator = restate.service({
  name: "CronJobInitiator",
  handlers: {
    create: async (ctx: restate.Context, req: CronRequest) => {
      // Creates a job ID and waits for successful initiation of the job
      const jobId = ctx.rand.uuidv4();
      const job = await ctx.objectClient(cronJob, jobId).initiateJob(req);
      return `Cron job created with ID: ${jobId} and next execution at: ${job.next_execution_time}`;
    },
  },
});

const cronJob = restate.object({
  name: "CronJob",
  handlers: {
    initiateJob: async (
      ctx: restate.ObjectContext,
      req: CronRequest
    ): Promise<CronJobSpec> => {
      // Check if the job already exists
      const job = await ctx.get<CronJobSpec>(JOB);
      if (job) {
        throw new TerminalError(
          "Job already exists. Use a different ID or cancel the existing job first."
        );
      }

      // starting the cron job the first time
      return await scheduleNextExecution(ctx, req);
    },
    execute: async (ctx: restate.ObjectContext) => {
      const job = await ctx.get<CronJobSpec>(JOB);
      if (!job) {
        throw new TerminalError("No cron job information found.");
      }

      // execute the task
      const { service, method, key, parameter } = job.req;
      ctx.genericSend({
        service,
        method,
        key,
        parameter,
        inputSerde: parameter ? serde.json : serde.empty,
      });

      await scheduleNextExecution(ctx, job.req);
    },
    cancel: async (ctx: restate.ObjectContext) => {
      // Cancel the cron job by canceling the next execution
      const job = await ctx.get<CronJobSpec>(JOB);
      if (job) {
        ctx.cancel(job.next_execution_id);
      }

      // Clear the job state
      ctx.clearAll();
    },
    getInfo: async (ctx: restate.ObjectSharedContext) =>
      ctx.get<CronJobSpec>(JOB),
  },
});

const scheduleNextExecution = async (
  ctx: restate.ObjectContext,
  req: CronRequest
): Promise<CronJobSpec> => {
  // Parse the cron expression to determine the next execution time
  // Persist current date in Restate for deterministic replay
  const now = await ctx.date.now();
  let interval;
  try {
    interval = CronExpressionParser.parse(req.expr, { currentDate: now });
  } catch (e) {
    throw new TerminalError(`Invalid cron expression: ${(e as Error).message}`);
  }

  const next = interval.next().toDate();
  const delay = next.getTime() - now;

  // Schedule the next execution of the task
  const handle = ctx.objectSendClient(cronJob, ctx.key, { delay }).execute();

  // Store the job information in the Restate for later retrieval
  const job = {
    req,
    next_execution_time: next.toString(),
    next_execution_id: await handle.invocationId,
  };
  ctx.set<CronJobSpec>(JOB, job);
  return job;
};

restate
    .endpoint()
    .bind(cronJobInitiator)
    .bind(cronJob)
    .bind(taskService)
    .listen(9080);
