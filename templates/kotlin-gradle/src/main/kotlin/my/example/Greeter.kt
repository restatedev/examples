package my.example

import dev.restate.sdk.annotation.Handler
import dev.restate.sdk.annotation.VirtualObject
import dev.restate.sdk.http.vertx.RestateHttpEndpointBuilder
import dev.restate.sdk.kotlin.KtStateKey
import dev.restate.sdk.kotlin.ObjectContext

@VirtualObject
class Greeter {

  companion object {
    private val COUNT = KtStateKey.json<Int>("count")
  }

  @Handler
  suspend fun greet(ctx: ObjectContext, greeting: String): String {
    val count = ctx.get(COUNT) ?: 1
    ctx.set(COUNT, count + 1)

    return "$greeting ${ctx.key()} for the $count time!"
  }
}

fun main() {
  RestateHttpEndpointBuilder
          .builder()
          .bind(Greeter())
          .buildAndListen()
}
