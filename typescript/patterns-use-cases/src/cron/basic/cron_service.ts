import * as restate from "@restatedev/restate-sdk";
import { CronExpressionParser } from "cron-parser";
import { taskService } from "./task_service";
import { serde } from "@restatedev/restate-sdk-clients";
import {TerminalError} from "@restatedev/restate-sdk";

type CronRequest = {
  expr: string; // The cron expression e.g. "0 0 * * *" (every day at midnight)
  service: string;
  handler: string; // Handler to execute with this schedule
  key?: string; // Optional: Virtual Object key to call
  payload?: any;
};

/*
The most basic form of a cron service that schedules tasks based on cron expressions.
It uses a cron expression parser to determine the next execution time and schedules the task accordingly.

The service can be used to schedule any handler in any service, including virtual objects.
Restate guarantees that the handler will be executed at the scheduled time.

You can cancel the cron job by canceling the next execution from the UI.
Have a look at the advanced cron service implementation for better task management and observability.
 */
const cronService = restate.service({
  name: "CronService",
  handlers: {
    create: async (ctx: restate.Context, req: CronRequest) => {
      // starting the cron job the first time
      await scheduleNext(ctx, req);
    },
    execute: async (ctx: restate.Context, req: CronRequest) => {
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
  },
});

const scheduleNext = async (ctx: restate.Context, req: CronRequest) => {
  let interval ;
  try {
    interval = CronExpressionParser.parse(req.expr);
  } catch (e) {
    throw new TerminalError(`Invalid cron expression ${(e as Error).message}`)
  }
  const next = interval.next().toDate().getTime();
  const delay = next - Date.now();
  ctx.serviceSendClient(cronService, { delay: delay }).execute(req);
};

restate.endpoint().bind(cronService).bind(taskService).listen(9080);
