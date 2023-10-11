package dev.restate.sdk.examples;

import dev.restate.sdk.blocking.RestateBlockingService;
import dev.restate.sdk.blocking.RestateContext;
import dev.restate.sdk.core.StateKey;
import dev.restate.sdk.examples.generated.*;
import dev.restate.sdk.http.vertx.RestateHttpEndpointBuilder;
import io.grpc.stub.StreamObserver;
import static dev.restate.sdk.examples.generated.GreeterProto.*;

public class Greeter extends GreeterGrpc.GreeterImplBase implements RestateBlockingService {

  private static final StateKey<Integer> COUNT = StateKey.of("count", Integer.class);

  @Override
  public void greet(GreetRequest request, StreamObserver<GreetResponse> responseObserver) {
    RestateContext ctx = restateContext();

    int count = ctx.get(COUNT).orElse(1);
    ctx.set(COUNT, count + 1);

    responseObserver.onNext(GreetResponse.newBuilder()
                    .setMessage("Hello " + request.getName() + " for the " + count + " time!")
            .build());
    responseObserver.onCompleted();
  }

  public static void main(String[] args) {
    RestateHttpEndpointBuilder.builder().withService(new Greeter()).buildAndListen();
  }
}
