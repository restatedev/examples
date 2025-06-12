package my.example.concurrenttasks.utils;

import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;

public class EmailClient {
  private static final Logger logger = LogManager.getLogger(EmailClient.class);

  public static String sendVerificationEmail(String email, String id) {
    logger.info("Sending email to {}", email);
    logger.info("\n Verify by clicking: curl http://localhost:8080/restate/awakeables/" + id + "/resolve --json 'true'");

    return "Email sent";
  }

  public static void sendReminder(String email, String id) {
    logger.info("Sending reminder to {}", email);
    logger.info("\n Verify by clicking: curl http://localhost:8080/restate/awakeables/" + id + "/resolve --json 'true'");
  }
}
