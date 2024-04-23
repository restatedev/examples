package my.example

import dev.restate.sdk.annotation.Handler
import dev.restate.sdk.annotation.Service
import dev.restate.sdk.http.vertx.RestateHttpEndpointBuilder
import dev.restate.sdk.kotlin.Context

/**
 * Template of a Restate service and handler
 * Have a look at the Kotlin QuickStart to learn how to run this: https://docs.restate.dev/get_started/quickstart?sdk=kotlin
 */
@Service
class Greeter {

  @Handler
  suspend fun greet(ctx: Context, greeting: String): String {

    return greeting
  }
}

fun main() {
  RestateHttpEndpointBuilder
          .builder()
          .bind(Greeter())
          .buildAndListen()
}