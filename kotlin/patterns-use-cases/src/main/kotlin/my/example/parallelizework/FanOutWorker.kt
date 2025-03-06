package my.example.parallelizework

import dev.restate.sdk.annotation.Handler
import dev.restate.sdk.annotation.Service
import dev.restate.sdk.http.vertx.RestateHttpEndpointBuilder
import dev.restate.sdk.kotlin.Awaitable
import dev.restate.sdk.kotlin.Context
import dev.restate.sdk.kotlin.awaitAll
import dev.restate.sdk.kotlin.runBlock

@Service
class FanOutWorker {
    @Handler
    suspend fun run(ctx: Context, task: Task): TaskResult {
        val subTasks = ctx.runBlock { task.split() }

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
