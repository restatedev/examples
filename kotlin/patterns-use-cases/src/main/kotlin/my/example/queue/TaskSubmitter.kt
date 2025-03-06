package my.example.queue

import dev.restate.sdk.client.CallRequestOptions
import dev.restate.sdk.client.Client
import dev.restate.sdk.kotlin.KtSerdes

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
                // optionally add a delay to execute the task later
                .send(/*5.days*/)
                .runTask(
                    this,
                    // use a stable uuid as an idempotency key; Restate deduplicates for us
                    CallRequestOptions.DEFAULT.withIdempotency("dQw4w9WgXcQ"),
                )


        // ... do other things while the task is being processed ...

        // await the handler's result; optionally from another process
        val result =
            restateClient.invocationHandle(
                handle.invocationId,
                KtSerdes.json<String>(),
            )
                .attach()
    }
}
