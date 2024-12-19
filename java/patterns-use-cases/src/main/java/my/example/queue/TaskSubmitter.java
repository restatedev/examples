package my.example.queue;

import dev.restate.sdk.JsonSerdes;
import dev.restate.sdk.client.CallRequestOptions;
import dev.restate.sdk.client.Client;
import dev.restate.sdk.client.SendResponse;

import java.time.Duration;

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
public class TaskSubmitter {

    private static final String RESTATE_URL = "http://localhost:8080";
    private static final Client restateClient = Client.connect(RESTATE_URL);

    public void submitAndAwaitTasks(AsyncTaskService.TaskOpts taskOpts) {

        // submit the task; similar to publishing a message to a queue
        // Restate ensures the task is executed exactly once
        SendResponse handle =
                AsyncTaskServiceClient.fromClient(restateClient)
                        // optionally add a delay to execute the task later
                        .send(/*Duration.ofDays(1)*/)
                        .runTask(
                                taskOpts,
                                // use a stable uuid as an idempotency key
                                CallRequestOptions.DEFAULT.withIdempotency("dQw4w9WgXcQ")
                        );

        // await the handler's result; optionally from another process
        String result = restateClient.invocationHandle(handle.getInvocationId(), JsonSerdes.STRING).attach();
    }
}
