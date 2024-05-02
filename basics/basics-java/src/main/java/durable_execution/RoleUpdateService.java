/*
 * Copyright (c) 2024 - Restate Software, Inc., Restate GmbH
 *
 * This file is part of the Restate Examples
 * which is released under the MIT license.
 *
 * You can find a copy of the license in the file LICENSE
 * in the root directory of this repository or package or at
 * https://github.com/restatedev/examples/blob/main/LICENSE
 */

package durable_execution;

import dev.restate.sdk.Context;
import dev.restate.sdk.annotation.Handler;
import dev.restate.sdk.annotation.Service;
import dev.restate.sdk.common.CoreSerdes;
import dev.restate.sdk.http.vertx.RestateHttpEndpointBuilder;
import utils.Permission;
import durable_execution.utils.UpdateRequest;

import static utils.ExampleStubs.applyPermission;
import static utils.ExampleStubs.applyUserRole;

// This is an example of the benefits of Durable Execution.
// Durable Execution ensures code runs to the end, even in the presence of
// failures. This is particularly useful for code that updates different systems and needs to
// make sure all updates are applied:
//
//  - Failures are automatically retried, unless they are explicitly labeled
//    as terminal errors
//  - Restate tracks execution progress in a journal.
//    Work that has already been completed is not repeated during retries.
//    Instead, the previously completed journal entries are replayed.
//    This ensures that stable deterministic values are used during execution.
//  - Durable executed functions use the regular code and control flow,
//    no custom DSLs
//
@Service
public class RoleUpdateService {

    @Handler
    public void applyRoleUpdate(Context ctx, UpdateRequest req) {

        // Apply a change to one system (e.g., DB upsert, API call, ...).
        // The side effect persists the result with a consensus method so
        // any later code relies on a deterministic result.
        boolean success = ctx.run(CoreSerdes.JSON_BOOLEAN, () ->
            applyUserRole(req.getUserId(), req.getRole()));
        if (!success) {
            return;
        }

        // Loop over the permission settings and apply them.
        // Each operation through the Restate context is journaled
        // and recovery restores results of previous operations from the journal
        // without re-executing them.
        for(Permission permission: req.getPermissions()) {
            ctx.run(() -> applyPermission(req.getUserId(), permission));
        }
    }

    public static void main(String[] args) {
        RestateHttpEndpointBuilder.builder()
                .bind(new RoleUpdateService())
                .buildAndListen();
    }
}

//
// See README for details on how to start and connect Restate.
//
// When invoking this function (see below for sample request), it will apply all
// role and permission changes, regardless of crashes.
// You will see all lines of the type "Applied permission remove:allow for user Sam Beckett"
// in the log, across all retries. You will also see that re-tries will not re-execute
// previously completed actions again, so each line occurs only once.
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