package my.example

import dev.restate.sdk.annotation.Handler
import dev.restate.sdk.annotation.VirtualObject
import dev.restate.sdk.common.StateKey
import dev.restate.sdk.http.vertx.RestateHttpEndpointBuilder
import dev.restate.sdk.kotlin.KtSerdes
import dev.restate.sdk.kotlin.ObjectContext

@VirtualObject
class Greeter {

  companion object {
    private val COUNT = StateKey.of<Int>("count", KtSerdes.json())
  }

  @Handler
  suspend fun greet(ctx: ObjectContext, name: String): String {
    val count = ctx.get(COUNT) ?: 1
    ctx.set(COUNT, count + 1)

    return "Hello $name for the $count time!"
  }
}

fun main() {
  RestateHttpEndpointBuilder
          .builder()
          .bind(Greeter())
          .buildAndListen()
}
