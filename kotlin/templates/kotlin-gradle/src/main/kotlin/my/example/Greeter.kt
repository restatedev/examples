package my.example

import dev.restate.sdk.annotation.Handler
import dev.restate.sdk.annotation.Service
import dev.restate.sdk.http.vertx.RestateHttpEndpointBuilder
import dev.restate.sdk.kotlin.Context
import dev.restate.sdk.kotlin.runBlock
import kotlin.time.Duration.Companion.seconds

@Service
class Greeter {

  @Handler
  suspend fun greet(ctx: Context, name: String): String {
    // Durably execute a set of steps; resilient against failures
    val greetingId = ctx.random().nextUUID().toString()
    ctx.runBlock { sendNotification(greetingId, name) }
    ctx.sleep(1.seconds)
    ctx.runBlock { sendReminder(greetingId) }

    // Respond to caller
    return "You said hi to $name!";
  }
}

fun main() {
  RestateHttpEndpointBuilder
          .builder()
          .bind(Greeter())
          .buildAndListen()
}