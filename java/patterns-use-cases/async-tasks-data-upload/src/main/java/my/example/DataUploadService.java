package my.example;

import static my.example.utils.DataOperations.createS3Bucket;
import static my.example.utils.DataOperations.uploadData;

import dev.restate.sdk.JsonSerdes;
import dev.restate.sdk.SharedWorkflowContext;
import dev.restate.sdk.WorkflowContext;
import dev.restate.sdk.annotation.Shared;
import dev.restate.sdk.annotation.Workflow;
import dev.restate.sdk.common.DurablePromiseKey;
import dev.restate.sdk.http.vertx.RestateHttpEndpointBuilder;
import my.example.utils.EmailClient;

@Workflow
public class DataUploadService {

  private static final DurablePromiseKey<String> URL_PROMISE =
      DurablePromiseKey.of("url", JsonSerdes.STRING);

  @Workflow
  public String run(WorkflowContext ctx) {
    String url = ctx.run(JsonSerdes.STRING, () -> createS3Bucket());
    ctx.run(() -> uploadData(url));

    ctx.promiseHandle(URL_PROMISE).resolve(url);
    return url;
  }

  @Shared
  public void resultAsEmail(SharedWorkflowContext ctx, String email) {
    String url = ctx.promise(URL_PROMISE).awaitable().await();
    ctx.run(() -> EmailClient.send(url, email));
  }

  public static void main(String[] args) {
     RestateHttpEndpointBuilder.builder().bind(new DataUploadService()).buildAndListen(9082);
  }
}
