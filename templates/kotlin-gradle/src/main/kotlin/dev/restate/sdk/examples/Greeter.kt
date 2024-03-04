package dev.restate.sdk.examples

import dev.restate.sdk.common.StateKey
import dev.restate.sdk.examples.generated.*
import dev.restate.sdk.examples.generated.GreeterProto.GreetRequest
import dev.restate.sdk.examples.generated.GreeterProto.GreetResponse
import dev.restate.sdk.http.vertx.RestateHttpEndpointBuilder
import dev.restate.sdk.kotlin.KtSerdes
import dev.restate.sdk.kotlin.ObjectContext
import dev.restate.sdk.kotlin.RestateKtComponent
import kotlinx.coroutines.Dispatchers

class Greeter :
    // Use Dispatchers.Unconfined as the Executor/thread pool is managed by the SDK itself.
    GreeterGrpcKt.GreeterCoroutineImplBase(Dispatchers.Unconfined),
        RestateKtComponent {

  companion object {
    private val COUNT = StateKey.of<Int>("count", KtSerdes.json())
  }

  override suspend fun greet(request: GreetRequest): GreetResponse {
    val ctx = ObjectContext.current()

    val count = ctx.get(COUNT) ?: 1
    ctx.set(COUNT, count + 1)

    return greetResponse {
      message = "Hello ${request.name} for the $count time!"
    }
  }
}

fun main() {
  RestateHttpEndpointBuilder
          .builder()
          .withService(Greeter()).buildAndListen()
}
