package my.example

import dev.restate.sdk.annotation.Handler
import dev.restate.sdk.annotation.Service
import dev.restate.sdk.http.vertx.RestateHttpServer
import dev.restate.sdk.kotlin.*
import dev.restate.sdk.kotlin.endpoint.endpoint
import kotlin.time.Duration.Companion.seconds

@Service
class Greeter {

  @Handler
  suspend fun greet(ctx: Context, name: String): String {
    // Durably execute a set of steps; resilient against failures
    val greetingId = ctx.random().nextUUID().toString()
    ctx.runBlock("Notification") { sendNotification(greetingId, name) }
    ctx.sleep(1.seconds)
    ctx.runBlock("Reminder") { sendReminder(greetingId, name) }

    // Respond to caller
    return "You said hi to $name!";
  }
}

fun main() {
  RestateHttpServer.listen(endpoint {
    bind(Greeter())
  })
}