import * as restate from "@restatedev/restate-sdk-clients";
import { AsyncTaskWorker, TaskOpts } from "./async_task_worker";
import {SendOpts} from "@restatedev/restate-sdk-clients";


const RESTATE_URL = "http://localhost:8080";

async function submitAndAwaitTask(task: TaskOpts) {
  // This example uses the programmatic clients to call into Restate and submit a task
  // Alternatively, to invoke a handler from within another Restate handler, use the Context methods instead!
  const restateClient = restate.connect({ url: RESTATE_URL });

  // Submit the task; similar to publishing a message to a queue
  // The handler can continue with other work while the task is being processed
  // or even finish before the task is done. Restate will do retries etc.
  const taskHandle = await restateClient
    .serviceSendClient<AsyncTaskWorker>({ name: "asyncTaskWorker" })
    .runTask(
      task,
      // use a stable uuid as an idempotency key; Restate deduplicates for us
      // optionally, execute the task later by adding a delay
      SendOpts.from({ idempotencyKey: task.id, /*delay: 1000*/ })
    );

  // ... Do other things while the task is being processed ...

  // Later on, you can retrieve the result of the task
  const result = await restateClient.result(taskHandle);
}

async function attachToTaskFromOtherProcess(taskHandle: string) {
  // Other processes can also attach to the task to get the result
  const restateClient = restate.connect({ url: RESTATE_URL });
  const result = await restateClient.result<string>(JSON.parse(taskHandle));
  // Alternatively, you can submit the same send request with the same idempotency key to latch onto the task
}
