import dev.restate.sdk.http.vertx.RestateHttpEndpointBuilder

object Main {
  def main(args: Array[String]): Unit = {
    RestateHttpEndpointBuilder.builder()
      // Register the service Greeter
      .withService(new Greeter())
      // Start the Restate Endpoint HTTP Server
      .buildAndListen();
  }
}