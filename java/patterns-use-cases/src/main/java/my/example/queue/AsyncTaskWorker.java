package my.example.queue;

import dev.restate.sdk.Context;
import dev.restate.sdk.annotation.Handler;
import dev.restate.sdk.annotation.Service;
import dev.restate.sdk.endpoint.Endpoint;
import dev.restate.sdk.http.vertx.RestateHttpServer;

@Service
public class AsyncTaskWorker {

  public record TaskOpts(String key, String taskName, String payload) {}

  @Handler
  public String runTask(Context ctx, TaskOpts params) {
    return someHeavyWork(params);
  }

  private String someHeavyWork(TaskOpts params) {
    return "someHeavyWork";
  }

  public static void main(String[] args) {
    RestateHttpServer.listen(Endpoint.bind(new AsyncTaskWorker()));
  }
}
