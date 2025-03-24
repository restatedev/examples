package my.example.parallelizework

import dev.restate.sdk.annotation.Handler
import dev.restate.sdk.annotation.Service
import dev.restate.sdk.http.vertx.RestateHttpEndpointBuilder
import dev.restate.sdk.kotlin.Awaitable
import dev.restate.sdk.kotlin.Context
import dev.restate.sdk.kotlin.awaitAll
import dev.restate.sdk.kotlin.runBlock

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
    suspend fun run(ctx: Context, task: Task): TaskResult {
        // Split the task in subtasks
        val subTasks = ctx.runBlock { task.split() }

        // Fan out the subtasks - run them in parallel
        // Fan in - Await all results and aggregate
        val results = subTasks.map {
          FanOutWorkerClient.fromContext(ctx).runSubtask(it)
        }.awaitAll()

        return results.aggregate()
    }

    @Handler
    suspend fun runSubtask(ctx: Context, subTask: SubTask): SubTaskResult {
        // Processing logic goes here ...
        // Can be moved to a separate service to scale independently
        return subTask.execute(ctx)
    }
}

fun main() {
    RestateHttpEndpointBuilder.builder().bind(FanOutWorker()).buildAndListen()
}
