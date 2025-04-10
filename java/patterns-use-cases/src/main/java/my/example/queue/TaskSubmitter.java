package my.example.queue;

import dev.restate.client.Client;

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

    public void submitAndAwaitTasks(AsyncTaskWorker.TaskOpts taskOpts) {
        Client restateClient = Client.connect(RESTATE_URL);

        // submit the task; similar to publishing a message to a queue
        // Restate ensures the task is executed exactly once
        var handle =
                AsyncTaskWorkerClient.fromClient(restateClient)
                        // optionally add a delay to execute the task later
                        .send()
                        .runTask(
                                taskOpts,
                                // optionally add a delay to execute the task later
                                // Duration.ofDays(1),
                                // use a stable uuid as an idempotency key; Restate deduplicates for us
                                opts -> opts.idempotencyKey("dQw4w9WgXcQ")
                        );

        // ... do other things while the task is being processed ...

        // await the handler's result; optionally from another process
        String result = handle.attach().response();
    }
}
