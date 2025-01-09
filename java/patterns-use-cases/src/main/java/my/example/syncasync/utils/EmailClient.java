package my.example.syncasync.utils;

import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;

public class EmailClient {
    private static final Logger logger = LogManager.getLogger(EmailClient.class);

    public static void send(String email, String url){
        logger.info("Sending email to {} with url {}", email, url);
    }
}
