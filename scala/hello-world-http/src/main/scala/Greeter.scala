import dev.restate.sdk.RestateService
import greeter.{GreetRequest, GreetResponse}
import io.grpc.stub.StreamObserver
import dev.restate.sdk.common.{CoreSerdes, StateKey}
import greeter.GreeterGrpc.GreeterImplBase

class Greeter extends GreeterImplBase with RestateService {
  private val COUNT = StateKey.of[Integer]("count", CoreSerdes.INT)

  override def greet(request: GreetRequest, responseObserver: StreamObserver[GreetResponse]): Unit = {
    val ctx = restateContext

    val count = ctx.get(COUNT).orElse(Integer.valueOf(1))
    ctx.set(COUNT, Integer.valueOf(count + 1))

    responseObserver.onNext(GreetResponse.newBuilder.setMessage("Hello " + request.getName + " for the " + count + " time!").build)
    responseObserver.onCompleted()
  }
}