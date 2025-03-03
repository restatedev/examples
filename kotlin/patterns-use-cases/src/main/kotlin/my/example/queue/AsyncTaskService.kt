package my.example.queue

import dev.restate.sdk.annotation.Handler
import dev.restate.sdk.annotation.Service
import dev.restate.sdk.http.vertx.RestateHttpEndpointBuilder
import dev.restate.sdk.kotlin.Context
import kotlinx.serialization.Serializable

@Service
class AsyncTaskService {
    @Handler
    suspend fun runTask(ctx: Context, params: TaskOpts): String {
        return someHeavyWork(params)
    }
}

fun main() {
     RestateHttpEndpointBuilder.builder().bind(AsyncTaskService()).buildAndListen()
}

@Serializable
class TaskOpts

fun someHeavyWork(task: TaskOpts): String {
    return "someHeavyWork"
}
