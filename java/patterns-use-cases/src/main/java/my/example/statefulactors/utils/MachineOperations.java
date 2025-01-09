package my.example.statefulactors.utils;

import dev.restate.sdk.Context;
import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;

import java.time.Duration;

public class MachineOperations {
    private static final Logger logger = LogManager.getLogger(MachineOperations.class);
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

    public static void bringUpMachine(Context ctx, String machineId) {
        logger.info("{} beginning transition to UP", machineId);

        // Some long fragile process
        maybeCrash(0.4);
        ctx.sleep(Duration.ofMillis(5000));
        logger.info("{} is now running", machineId);
    }

    public static void tearDownMachine(Context ctx, String machineId) {
        logger.info("{} beginning transition to down", machineId);

        // Some long fragile process
        maybeCrash(0.4);
        ctx.sleep(Duration.ofMillis(5000));
        logger.info("{} is now down", machineId);
    }
}
