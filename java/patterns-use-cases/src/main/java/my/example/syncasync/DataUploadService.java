package my.example.syncasync;

import static my.example.syncasync.utils.DataOperations.createS3Bucket;
import static my.example.syncasync.utils.DataOperations.uploadData;

import dev.restate.sdk.Restate;
import dev.restate.sdk.annotation.Shared;
import dev.restate.sdk.annotation.Workflow;
import dev.restate.sdk.common.DurablePromiseKey;
import dev.restate.sdk.endpoint.Endpoint;
import dev.restate.sdk.http.vertx.RestateHttpServer;
import my.example.syncasync.utils.EmailClient;

@Workflow
public class DataUploadService {

  private static final DurablePromiseKey<String> URL_PROMISE =
      DurablePromiseKey.of("url", String.class);

  @Workflow
  public String run() {
    String url = Restate.run("create bucket", String.class, () -> createS3Bucket());
    Restate.run("upload", () -> uploadData(url));

    Restate.promiseHandle(URL_PROMISE).resolve(url);

    return url;
  }

  @Shared
  public void resultAsEmail(String email) {
    String url = Restate.promise(URL_PROMISE).future().await();
    Restate.run("send email", () -> EmailClient.send(url, email));
  }

  public static void main(String[] args) {
    RestateHttpServer.listen(Endpoint.bind(new DataUploadService()));
  }
}
