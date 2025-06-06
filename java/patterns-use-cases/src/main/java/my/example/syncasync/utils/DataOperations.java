package my.example.syncasync.utils;

import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;

public class DataOperations {
  private static final Logger logger = LogManager.getLogger(DataOperations.class);

  public static String createS3Bucket() {
    String bucket = String.valueOf((long) (Math.random() * 1_000_000_000));
    String bucketUrl = "https://s3-eu-central-1.amazonaws.com/" + bucket + "/";
    logger.info("Creating bucket with URL {}", bucketUrl);
    return bucketUrl;
  }

  public static void uploadData(String url) {
    long timeRemaining = Math.random() < 0.5 ? 1500 : 10000;
    logger.info("Uploading data to target {}. ETA: {} ms", url, timeRemaining);
    try {
      Thread.sleep(timeRemaining);
    } catch (InterruptedException e) {
      logger.error("Upload failed: {}", e.getMessage());
    }
  }
}
