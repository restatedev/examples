package utils;

import dev.restate.sdk.common.TerminalException;
import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;

public class FailureStubs {

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

    public static void applicationError(Double probability, String message){
        if(Math.random() < probability){
            logger.error("Action failed: " + message);
            throw new TerminalException(message);
        }
    }

}
