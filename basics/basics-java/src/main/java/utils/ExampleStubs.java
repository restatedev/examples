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

    public static void applicationError(Double probability, String message){
        if(Math.random() < probability){
            logger.error("Action failed: " + message);
            throw new TerminalException(message);
        }
    }

    public static boolean applyUserRole(String userId, UserRole role) {
        maybeCrash(0.3);
        logger.info(">>> Applying role " + role + " to user " + userId);
        return true;
    }

    public static void applyPermission(String userId, Permission permission) {
        maybeCrash(0.2);
        logger.info(">>> Applying permission %s:%s for user %s",
                permission.getPermissionKey(),
                permission.getSetting(),
                userId);
    }

    public static UserRole getCurrentRole(String userId){
        return new UserRole("viewer", "User cannot do much");
    }

    public static void tryApplyUserRole(String userId, UserRole role) {
        maybeCrash(0.3);

        if(!role.getRoleKey().equals("viewer")){
            applicationError(0.3, "Role " + role.getRoleKey() + " is not possible for user " + userId);
        }
        logger.error(">>> Applying role " + role + " to user " + userId);
    }

    public static Permission tryApplyPermission(String userId, Permission permission){
        maybeCrash(0.3);

        if(!permission.getSetting().equals("blocked")) {
            applicationError(0.4,
                    "Could not apply permission " + permission.getPermissionKey() +
                            ":" + permission.getSetting() + " for user" + userId + " due to a conflict."
                    );
        }
        logger.info(">>> Applying permission %s:%s for user %s",
                permission.getPermissionKey(),
                permission.getSetting(),
                userId);

        return new Permission(permission.getPermissionKey(), "blocked");
    }

    public static String updateUserProfile(String profile) {
        return Math.random() < 0.8 ? "NOT_READY" : profile + "-id";
    }

    public static String setUserPermissions(String userId, String permissions) {
        return permissions;
    }

    public static void provisionResources(String userId, String role, String resources){}

}
