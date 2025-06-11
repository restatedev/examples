package my.example

import dev.restate.sdk.annotation.Handler
import dev.restate.sdk.annotation.Service
import dev.restate.sdk.http.vertx.RestateHttpServer
import dev.restate.sdk.kotlin.*
import dev.restate.sdk.kotlin.endpoint.endpoint
import kotlin.time.Duration.Companion.seconds
import kotlinx.serialization.Serializable

@Service
class Greeter {

  @Serializable
  data class Greeting(val name: String)
  @Serializable
  data class GreetingResponse(val message: String)

  @Handler
  suspend fun greet(ctx: Context, req: Greeting): GreetingResponse {
    // Durably execute a set of steps; resilient against failures
    val greetingId = ctx.random().nextUUID().toString()
    ctx.runBlock("Notification") { sendNotification(greetingId, req.name) }
    ctx.sleep(1.seconds)
    ctx.runBlock("Reminder") { sendReminder(greetingId, req.name) }

    // Respond to caller
    return GreetingResponse("You said hi to ${req.name}!")
  }
}

fun main() {
  RestateHttpServer.listen(endpoint {
    bind(Greeter())
  })
}