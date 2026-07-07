package my.example.queue

import dev.restate.client.Client
import dev.restate.client.kotlin.*
import dev.restate.serde.kotlinx.KotlinSerializationSerdeFactory

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
    // A Kotlin service<T>()/virtualObject<T>()/workflow<T>() proxy serializes with
    // kotlinx.serialization, so the client must be built with the kotlinx serde factory.
    private val restateClient: Client =
        Client.connect("http://localhost:8080", KotlinSerializationSerdeFactory())
  }

  suspend fun TaskOpts.scheduleTask() {
    // submit the task; similar to publishing a message to a queue
    // Restate ensures the task is executed exactly once
    val handle =
        restateClient
            .toService<AsyncTaskService>()
            .request { runTask(this@scheduleTask) }
            // optionally add a delay to execute the task later, e.g. .send(5.days)
            .options {
              // use a stable uuid as an idempotency key; Restate deduplicates for us
              idempotencyKey = "dQw4w9WgXcQ"
            }
            .send()

    // ... do other things while the task is being processed ...

    // await the handler's result; optionally from another process
    val result = handle.attachSuspend()
  }
}
