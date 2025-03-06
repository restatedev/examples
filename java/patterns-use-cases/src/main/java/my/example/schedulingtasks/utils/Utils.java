package my.example.schedulingtasks.utils;

import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;

public class Utils {
    private static final Logger logger = LogManager.getLogger(Utils.class);

    public static void sendReminderEmail(StripeEvent event) {
        logger.info("Sending reminder email for event {}", event.data().id());
    }

    public static void escalateToHuman(StripeEvent event) {
        logger.info("Escalating {} invoice to support team", event.data().id());
    }
}
