package my.example.queue

import dev.restate.client.Client
import dev.restate.client.kotlin.*

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
class TaskSubmitter {
    companion object {
        private val restateClient: Client = Client.connect("http://localhost:8080")
    }

    suspend fun TaskOpts.scheduleTask() {
        // submit the task; similar to publishing a message to a queue
        // Restate ensures the task is executed exactly once
        val handle =
            AsyncTaskServiceClient.fromClient(restateClient)
                .send()
                .runTask(
                    this,
                    // optionally add a delay to execute the task later
                    // delay = 5.days,
                ) {
                    // use a stable uuid as an idempotency key; Restate deduplicates for us
                    idempotencyKey = "dQw4w9WgXcQ"
                }


        // ... do other things while the task is being processed ...

        // await the handler's result; optionally from another process
        val result =
            handle
                .attachSuspend()
    }
}
