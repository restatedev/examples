package utils;

import dev.restate.sdk.common.TerminalException;
import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;

public class ExampleStubs {
    private static final Logger logger = LogManager.getLogger(ExampleStubs.class);
    private static final boolean killProcess = System.getenv("CRASH_PROCESS") != null;

    public static void maybeCrash(double probability) {
        if (Math.random() < probability) {
            logger.error("A failure happened!");

            if (killProcess) {
                logger.error("--- CRASHING THE PROCESS ---");
                System.exit(1);
            } else {
                throw new RuntimeException("A failure happened!");
            }
        }
    }

    public static String createSubscription(String userId, String subscription, String paymentRef) {
        maybeCrash(0.3);
        logger.info(">>> Creating subscription {} for user {} with payment reference {}", subscription, userId, paymentRef);
        return "SUCCESS";
    }

    public static String createRecurringPayment(String creditCard, String paymentId) {
        maybeCrash(0.3);
        logger.info(">>> Creating recurring payment {}", paymentId);
        return "payment-reference";
    }

    public static void createUserEntry(User user){
        logger.info(">>> Creating user entry for {}", user.name());
    }

    public static void sendEmailWithLink(String userId, User user, String secret){
        logger.info(">>> Sending email with secret {} to user {}", secret, user.name());
        logger.info("To simulate a user clicking the link, run the following command: \n " +
                "curl localhost:8080/SignupWorkflow/{}/click -H 'content-type: application/json' -d '\"{}\"'",
                userId, secret);
    }

    public static void chargeBankAccount(String paymentDeduplicationID, int amount) {
        // Implementation here
    }
}
