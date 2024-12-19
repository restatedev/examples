import * as restate from "@restatedev/restate-sdk-clients";
import { AsyncTaskWorker, TaskOpts } from "./async_task_worker";
import {SendOpts} from "@restatedev/restate-sdk-clients";

/*
 * Restate is as a sophisticated task queue, with extra features like:
 * - delaying execution and reliable timers
 * - stateful tasks
 * - queues per key (>< per partition; slow tasks for a key don't block others)
 * - retries and recovery upon failures
 *
 * Every handler in Restate is executed asynchronously and can be treated
 * as a reliable asynchronous task.
 */

const RESTATE_URL = "http://localhost:8080";

async function submitAndAwaitTask(task: TaskOpts) {
  const restateClient = restate.connect({ url: RESTATE_URL });

  // submit the task; similar to publishing a message to a queue
  // Restate ensures the task is executed exactly once
  const taskHandle = await restateClient
    .serviceSendClient<AsyncTaskWorker>({ name: "taskWorker" })
    .runTask(
      task,
      // use a stable uuid as an idempotency key
      // optionally, execute the task later by adding a delay
      SendOpts.from({ idempotencyKey: task.id, /*delay: 1000*/ })
    );

  // await the task's result
  const result = await restateClient.result(taskHandle);
}

async function attachToTaskFromOtherProcess(taskHandle: string) {
  const restateClient = restate.connect({ url: RESTATE_URL });
  const result = await restateClient.result<string>(JSON.parse(taskHandle));
  // Alternatively, you can submit the same send request with the same idempotency key to latch onto the task
}
