package durable_execution_compensation;

import dev.restate.sdk.Context;
import dev.restate.sdk.annotation.Handler;
import dev.restate.sdk.annotation.Service;
import dev.restate.sdk.common.TerminalException;
import dev.restate.sdk.http.vertx.RestateHttpEndpointBuilder;
import dev.restate.sdk.serde.jackson.JacksonSerdes;
import durable_execution.utils.UpdateRequest;
import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import utils.Permission;
import utils.UserRole;

import java.util.ArrayList;
import java.util.List;

import static utils.ExampleStubs.*;

// This is an example of Durable Execution and compensation logic.
// Durable execution ensures code runs to the end, even in the presence of
// failures. That allows developers to implement error handling with common
// control flow in code:
//
//  - This example uses the SAGA pattern: on error, the code undos previous
//    operations in reverse order.
//  - The code uses common exception handling and variables/arrays to remember
//    the previous values to restore.
//

@Service
public class RoleUpdateService {
    private static final Logger logger = LogManager.getLogger(RoleUpdateService.class);

    @Handler
    public void applyRoleUpdate(Context ctx, UpdateRequest update){

        // Restate does retries for regular failures.
        // TerminalErrors, on the other hand, are not retried and are propagated
        // back to the caller.
        // Nothing applied so far, so we propagate the error directly back to the caller.
        UserRole previousRole = ctx.run(JacksonSerdes.of(UserRole.class),
                () -> getCurrentRole(update.getUserId()));
        ctx.run(() -> tryApplyUserRole(update.getUserId(), update.getRole()));

        // Apply all permissions in order.
        // We collect the previous permission settings to reset if the process fails.
        List<Permission> previousPermissions = new ArrayList<>();
        for (Permission permission : update.getPermissions()) {
            try {
                Permission previous = ctx.run(
                        JacksonSerdes.of(Permission.class),
                        () -> tryApplyPermission(update.getUserId(), permission));
                previousPermissions.add(previous); // remember the previous setting
            } catch (TerminalException err) {
                    rollback(ctx, update.getUserId(), previousRole, previousPermissions);
            }
        }
    }

    public static void main(String[] args) {
        RestateHttpEndpointBuilder.builder()
            .bind(new RoleUpdateService())
            .buildAndListen();
    }

    private void rollback(Context ctx, String userId, UserRole previousRole, List<Permission> previousPermissions) {
        logger.info(">>>  !!! ROLLING BACK CHANGES for user ID: " + userId);

        for (Permission permission : previousPermissions) {
            ctx.run(() -> tryApplyPermission(userId, permission));
        }

        ctx.run(() -> tryApplyUserRole(userId, previousRole));
    }
}

//
// See README for details on how to start and connect Restate.
//
// When invoking this function (see below for sample request), you will see that
// all role/permission changes are attempted. Upon an unrecoverable error (like a
// semantic application error), previous operations are reversed.
//
// You will see all lines of the type "Applied permission remove:allow for user Sam Beckett",
// and, in case of a terminal error, their reversal.
//
// This will proceed reliably across the occasional process crash, that we blend in.
// Once an action has completed, it does not get re-executed on retries, so each line occurs only once.

/*
curl localhost:8080/RoleUpdateService/applyRoleUpdate -H 'content-type: application/json' -d \
'{
    "userId": "Sam Beckett",
    "role": { "roleKey": "content-manager", "roleDescription": "Add/remove documents" },
    "permissions" : [
      { "permissionKey": "add", "setting": "allow" },
      { "permissionKey": "remove", "setting": "allow" },
      { "permissionKey": "share", "setting": "block" }
    ]
}'
*/
