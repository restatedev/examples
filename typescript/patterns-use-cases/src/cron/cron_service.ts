import * as restate from "@restatedev/restate-sdk";
import { CronExpressionParser } from "cron-parser";
import { InvocationId, serde, TerminalError } from "@restatedev/restate-sdk";

type JobRequest = {
  cronExpression: string; // The cron expression e.g. "0 0 * * *" (every day at midnight)
  service: string;
  method: string; // Handler to execute with this schedule
  key?: string; // Optional: Virtual Object key to call
  payload?: string; // Optional payload to pass to the handler
};

type JobInfo = {
  req: JobRequest;
  next_execution_time: string;
  next_execution_id: InvocationId;
};

const JOB = "job"; // Key for storing job information in the Restate object

/*
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
export const cronJobInitiator = restate.service({
  name: "CronJobInitiator",
  handlers: {
    create: async (ctx: restate.Context, req: JobRequest) => {
      const jobId = ctx.rand.uuidv4();
      const job = await ctx.objectClient(cronJob, jobId).initiate(req);
      return `Job created with ID ${jobId} and next execution time ${job.next_execution_time}`;
    },
  },
});

export const cronJob = restate.object({
  name: "CronJob",
  handlers: {
    initiate: async (
      ctx: restate.ObjectContext,
      req: JobRequest
    ): Promise<JobInfo> => {
      if (await ctx.get<JobInfo>(JOB)) {
        throw new TerminalError("Job already exists for this ID.");
      }

      return await scheduleNextExecution(ctx, req);
    },
    execute: async (ctx: restate.ObjectContext) => {
      const job = await ctx.get<JobInfo>(JOB);
      if (!job) {
        throw new TerminalError("Job not found.");
      }

      // execute the task
      const { service, method, key, payload } = job.req;
      if (payload) {
        ctx.genericSend({
          service,
          method,
          parameter: payload,
          key,
          inputSerde: serde.json,
        });
      } else {
        ctx.genericSend({
          service,
          method,
          parameter: undefined,
          key,
          inputSerde: serde.empty,
        });
      }

      await scheduleNextExecution(ctx, job.req);
    },
    cancel: async (ctx: restate.ObjectSharedContext) => {
      // Cancel the next execution
      const job = await ctx.get<JobInfo>(JOB);
      if (!job) {
        throw new TerminalError("Job not found.");
      }
      ctx.cancel(job.next_execution_id);
      ctx.objectSendClient(cronJob, ctx.key).cleanup()
    },
    cleanup: async (ctx: restate.ObjectContext) => {
      ctx.clearAll();
    },
    getInfo: async (ctx: restate.ObjectSharedContext) => ctx.get<JobInfo>(JOB),
  },
});

const scheduleNextExecution = async (
  ctx: restate.ObjectContext,
  req: JobRequest
): Promise<JobInfo> => {
  // Parse cron expression
  // Persist current date in Restate for deterministic replay
  const currentDate = await ctx.date.now();
  let interval;
  try {
    interval = CronExpressionParser.parse(req.cronExpression, { currentDate });
  } catch (e) {
    throw new TerminalError(`Invalid cron expression: ${(e as Error).message}`);
  }

  const next = interval.next().toDate();
  const delay = next.getTime() - currentDate;

  // Schedule next execution
  const handle = ctx.objectSendClient(cronJob, ctx.key, { delay }).execute();

  // Store the job information
  const job = {
    req,
    next_execution_time: next.toString(),
    next_execution_id: await handle.invocationId,
  };
  ctx.set<JobInfo>(JOB, job);
  return job;
};
