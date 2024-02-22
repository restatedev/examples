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

import * as restate from "@restatedev/restate-sdk";
import { maybeCrash, applicationError } from "./utils/failures";

// Durable execution ensures code runs to the end, even in the presence of
// failures. That allows developers to implement error handling with common
// control flow in code.
//
//  - This example uses the SAGA pattern: on error, the code undos previous
//    operations in reverse order
//  - The code uses common exception handling and variables/arrays to remember
//    the previous values to restore
//

async function applyRoleUpdate(ctx: restate.RpcContext, update: UpdateRequest) {
  // parameters are durable across retries
  const { userId, role, permissons } = update;

  // regular failures are re-tries, TerminalErrors are propagated
  // nothing applied so far, so we propagate the error directly
  const previousRole = await ctx.sideEffect(() => getCurrentRole(userId));
  await ctx.sideEffect(() => applyUserRole(userId, role));

  // apply all permissions in order
  // we collect the previous permission settings to reset if the process fails
  const previousPermissions: Permission[] = []
  for (const permission of permissons) {
    try {
      const previous = await ctx.sideEffect(() => applyPermission(userId, permission));
      previousPermissions.push(previous); // remember the previous setting
    } catch (err) {
      if (err instanceof restate.TerminalError) {
        await rollback(ctx, userId, previousRole, previousPermissions);
      }
      throw err;
    }
  }
}

async function rollback(ctx: restate.RpcContext, userId: string, role: UserRole, permissions: Permission[]) {
  console.log(">>> Rolling back changes.");
  for (const prev of permissions.reverse()) {
    await ctx.sideEffect(() => applyPermission(userId, prev));
  }
  await ctx.sideEffect(() => applyUserRole(userId, role));
}

// Add this function to the application:

// (a) Add it to an application task, process, HTTP server, RPC handler, ...
//    -> embedded function


// (b) Expose it as its own HTTP request handler through Restate


restate.createServer()
  .bindRouter("roleUpdate", restate.router({ applyRoleUpdate }))
  .listen(9080);

//
// See README for details on how to start and connect Restate server.
//
// When invoking this function (see below for sample request), you will see that
// all role/permission changes are attempted. Upon an unrecoverable error (like a
// semantic application error), previous operations are reversed.
//
// You will see all lines of the type "Applied permission remove:allow for user Sam Beckett",
// and, in case of a terminal error, their reversal.
//
// This will proceed reliably across the occasional process crash, that we blend in.
// Re-tries will not re-execute previously completed actions again, so each line occurs only once.

/* 
curl localhost:8080/roleUpdate/applyRoleUpdate -H 'content-type: application/json' -d \
'{
  "request": {
    "userId": "Sam Beckett",
    "role": { "roleKey": "content-manager", "roleDescription": "Add/remove documents" },
    "permissons" : [
      { "permissionKey": "add", "setting": "allow" },
      { "permissionKey": "remove", "setting": "allow" },
      { "permissionKey": "share", "setting": "block" }
    ]
  }
}'
*/

// ---------------------------------------------------------------------------
//                           stubs for this example
// ---------------------------------------------------------------------------

type UpdateRequest = {
  userId: string,
  role: UserRole,
  permissons: Permission[]
}

type UserRole = {
  roleKey: string,
  roleDescription: string
}

type Permission = {
  permissionKey: string,
  setting: string
}

/*
 * This function would typically call the service or API to record the new user role.
 * For the sake of this example, we sometimes fail when applying an advanced role
 * and otherwise return success.
 */
async function applyUserRole(userId: string, userRole: UserRole): Promise<void> {
  maybeCrash(0.3); // sometimes infra goes away

  if (userRole.roleKey !== "viewer") {
    applicationError(0.3, `Role ${userRole.roleKey} is not possible for user ${userId}`);
  }
  console.log(`>>> Applied role ${userRole.roleKey} for user ${userId}`);
}

async function getCurrentRole(userId: string): Promise<UserRole> {
  // in this example, the previous role was always just 'viewer'
  return { roleKey: "viewer", roleDescription: "User that cannot do much" }
}

/*
 * This function would call the service or API to apply a permission.
 * For the sake of this example, we sometimes fail when applying an 'allow' permission
 * and otherwise return success. Also, we sometimes crash the process.
 */
async function applyPermission(userId: string, permission: Permission): Promise<Permission> {
  const { permissionKey, setting } = permission;
  maybeCrash(0.3); // sometimes infra goes away

  if (setting !== "blocked") {
    applicationError(0.4, `Could not apply permission ${permissionKey}:${setting} for user ${userId} due to a conflict.`);
  }
  console.log(`>>> Applied permission ${permissionKey}:${setting} for user ${userId}`);
  return { permissionKey, setting: "blocked" }
}
