package my.example.parallelizework

import dev.restate.sdk.annotation.Handler
import dev.restate.sdk.annotation.Service
import dev.restate.sdk.http.vertx.RestateHttpServer
import dev.restate.sdk.kotlin.*
import dev.restate.sdk.kotlin.endpoint.endpoint

/*
 * Restate makes it easy to parallelize async work by fanning out tasks.
 * Afterward, you can collect the result by fanning in the partial results.
 *          +------------+
 *          | Split task |
 *          +------------+
 *                |
 *        ---------------------------------
 *        |                |              |
 * +--------------+ +--------------+ +--------------+
 * | Exec subtask | | Exec subtask | | Exec subtask |
 * +--------------+ +--------------+ +--------------+
 *        |                |               |
 *        ---------------------------------
 *                |
 *          +------------+
 *          | Aggregate  |
 *          +------------+
 * Durable Execution ensures that the fan-out and fan-in steps happen reliably exactly once.
 */
@Service
class FanOutWorker {
  @Handler
  suspend fun run(task: Task): TaskResult {
    // Split the task in subtasks
    val subTasks = runBlock { task.split() }

    // Fan out the subtasks - run them in parallel
    // Fan in - Await all results and aggregate
    val results =
        subTasks
            .map { subTask -> toService<FanOutWorker>().request { runSubtask(subTask) }.call() }
            .awaitAll()

    return results.aggregate()
  }

  @Handler
  suspend fun runSubtask(subTask: SubTask): SubTaskResult {
    // Processing logic goes here ...
    // Can be moved to a separate service to scale independently
    return subTask.execute()
  }
}

fun main() {
  RestateHttpServer.listen(endpoint { bind(FanOutWorker()) })
}
