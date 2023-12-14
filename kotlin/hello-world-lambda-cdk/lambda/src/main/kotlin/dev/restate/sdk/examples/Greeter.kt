package dev.restate.sdk.examples

import dev.restate.sdk.common.CoreSerdes
import dev.restate.sdk.common.StateKey
import dev.restate.sdk.examples.generated.*
import dev.restate.sdk.examples.generated.GreeterProto.GreetRequest
import dev.restate.sdk.examples.generated.GreeterProto.GreetResponse
import dev.restate.sdk.kotlin.RestateKtService
import kotlinx.coroutines.Dispatchers

class Greeter :
    // Use Dispatchers.Unconfined as the Executor/thread pool is managed by the SDK itself.
    GreeterGrpcKt.GreeterCoroutineImplBase(Dispatchers.Unconfined),
    RestateKtService {

  companion object {
    private val COUNT = StateKey.of("count", CoreSerdes.INT)
  }

  override suspend fun greet(request: GreetRequest): GreetResponse {
    val ctx = restateContext()

    val count = ctx.get(COUNT) ?: 1
    ctx.set(COUNT, count + 1)

    return greetResponse {
      message = "Hello ${request.name} for the $count time!"
    }
  }
}
