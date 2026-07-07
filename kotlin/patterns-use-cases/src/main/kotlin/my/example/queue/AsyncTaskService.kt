package my.example.queue

import dev.restate.sdk.annotation.Handler
import dev.restate.sdk.annotation.Service
import dev.restate.sdk.http.vertx.RestateHttpServer
import dev.restate.sdk.kotlin.endpoint.endpoint
import kotlinx.serialization.Serializable

@Service
class AsyncTaskService {
  @Handler
  suspend fun runTask(params: TaskOpts): String {
    return params.someHeavyWork()
  }
}

fun main() {
  RestateHttpServer.listen(endpoint { bind(AsyncTaskService()) })
}

@Serializable class TaskOpts

fun TaskOpts.someHeavyWork(): String {
  return "someHeavyWork"
}
