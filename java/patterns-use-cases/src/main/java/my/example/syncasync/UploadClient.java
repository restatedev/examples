package my.example.syncasync;

import dev.restate.client.Client;
import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;

import java.util.concurrent.TimeUnit;
import java.util.concurrent.TimeoutException;

// The upload client calls the data upload workflow and awaits the result for 5 seconds.
// If the workflow doesn't complete within that time, it asks the
// workflow to send the upload url via email instead.
public class UploadClient {
  private static final Logger logger = LogManager.getLogger(UploadClient.class);

  private static final String RESTATE_URL = "http://localhost:8080";

  public void uploadData(String userId, String email) {
    logger.info("Uploading data for user {}", userId);

    // Submit the workflow
    Client restateClient = Client.connect(RESTATE_URL);
    var uploadClient = DataUploadServiceClient.fromClient(restateClient, userId);
    uploadClient.submit();

    String url;
    try {
      // Wait for the workflow to complete or timeout
      url = uploadClient.workflowHandle().attachAsync()
              .orTimeout(5, TimeUnit.SECONDS)
              .join()
              .response();
    } catch (Exception e) {
      if (e.getCause() instanceof TimeoutException) {
        logger.info("Slow upload... Mail the link later");
        uploadClient.resultAsEmail(email);
        return;
      }
      throw e;
    }

    // ... process directly ...
    logger.info("Fast upload... URL was {}", url);
  }

  //--------------------------------------------------------------------------------
  // This client would be used in some other part of the system.
  // For the sake of this example, we are calling it here from the main method, so you can test the example.
  public static void main(String[] args) {
    if (args.length < 1) {
      System.err.println("Specify the userId as the argument: " +
              "./gradlew run -PmainClass=my.example.UploadClient --args=\"userId123\"");
      System.exit(1);
    }
    new UploadClient().uploadData(args[0], args[0] + "@example.com");
  }
}
