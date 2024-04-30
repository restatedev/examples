/*
 * Copyright (c) 2024 - Restate Software, Inc., Restate GmbH
 *
 * This file is part of the Restate Examples for the Node.js/TypeScript SDK,
 * which is released under the MIT license.
 *
 * You can find a copy of the license in the file LICENSE
 * in the root directory of this repository or package or at
 * https://github.com/restatedev/examples/blob/main/LICENSE
 */
package utils;

import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;

import static utils.FailureStubs.applicationError;
import static utils.FailureStubs.maybeCrash;

public class ExampleStubs {

    private static final Logger logger = LogManager.getLogger(ExampleStubs.class);

    public static boolean applyUserRole(String userId, UserRole role) {
        maybeCrash(0.3);
        logger.info(String.format(">>> Applying role %s to user %s", role, userId));
        return true;
    }

    public static void applyPermission(String userId, Permission permission) {
        maybeCrash(0.2);
        logger.info(String.format(">>> Applying permission %s:%s for user %s",
                permission.getPermissionKey(),
                permission.getSetting(),
                userId));
    }

    public static UserRole getCurrentRole(String userId){
        return new UserRole("viewer", "User cannot do much");
    }

    public static void tryApplyUserRole(String userId, UserRole role) {
        maybeCrash(0.3);

        if(!role.getRoleKey().equals("viewer")){
            applicationError(0.3, "Role " + role.getRoleKey() + " is not possible for user " + userId);
        }
        logger.error(String.format(">>> Applying role %s to user %s", role, userId));
    }

    public static Permission tryApplyPermission(String userId, Permission permission){
        maybeCrash(0.3);

        if(!permission.getSetting().equals("blocked")) {
            applicationError(0.4,
                    "Could not apply permission " + permission.getPermissionKey() +
                            ":" + permission.getSetting() + " for user" + userId + " due to a conflict."
                    );
        }
        logger.info(String.format(">>> Applying permission %s:%s for user %s",
                permission.getPermissionKey(),
                permission.getSetting(),
                userId));

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
