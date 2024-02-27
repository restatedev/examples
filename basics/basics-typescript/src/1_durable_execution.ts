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
import { maybeCrash } from "./utils/failures";

// Durable execution ensures code runs to the end, even in the presence of
// failures. Use this for code that updates different systems and needs to
// make sure all updates are applied.
//
//  - Failures are automatically retried, unless they are explicitly labeled
//    as terminal errors
//  - Restate journals execution progress. Re-tries use that journal to replay
//    previous alread completed results, avoiding a repetition of that work and
//    ensuring stable deterministic values are used during execution.
//  - Durable executed functions use the regular code and control flow,
//    no custom DSLs
//

async function applyRoleUpdate(ctx: restate.RpcContext, update: UpdateRequest) {
  // parameters are durable across retries
  const { userId, role, permissons } = update;
  
  // apply a change to one system (e.g., DB upsert, API call, ...)
  // the side effect persists the result with a consensus method so any
  // any later code relies on a deterministic result
  const success = await ctx.sideEffect(() => applyUserRole(userId, role));
  if (!success) {
    return;
  }

  // simply loop over the array or permission settings.
  // each operation through the Restate context is journaled and recovery restores
  // results of previous operations from the journal without re-executing them
  for (const permission of permissons) {
     await ctx.sideEffect(() => applyPermission(userId, permission));
  }
}

// Add this function to the application:

// (a) Add it to an application task, process, HTTP server, RPC handler, ...
//    -> embedded function

console.log("HELLO")

const testPayload: UpdateRequest = {
  userId: "Sam Beckett",
  role: { roleKey: "content-manager", roleDescription: "Add/remove documents" },
  permissons : [
    { permissionKey: "add", setting: "allow" },
    { permissionKey: "remove", setting: "allow" },
    { permissionKey: "share", setting: "block" }
  ]
}

const result = restate.connection("http://127.0.0.1:8080").invoke("test-id", testPayload, applyRoleUpdate)

console.log("connected")

result
  .then(() =>console.log("DONE"))
  .catch(console.error);

// (b) Expose it as its own HTTP request handler through Restate

// restate.createServer()
//   .bindRouter("roleUpdate", restate.router({ applyRoleUpdate }))
//   .listen(9080);

//
// See README for details on how to start and connect Restate server.
//
// When invoking this function (see below for sample request), it will apply all
// role and permission changes, regardless of crashes.
// You will see all lines of the type "Applied permission remove:allow for user Sam Beckett"
// in the log, across all retries. You will also see that re-tries will not re-execute
// previously completed actions again, so each line occurs only once.
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

type UserRole = {
  roleKey: string,
  roleDescription: string
}

type Permission = {
  permissionKey: string,
  setting: string
}

type UpdateRequest = {
  userId: string,
  role: UserRole,
  permissons: Permission[]

}

/*
 * This function would call the service or API to record the new user role.
 * For the sake of this example, we just fail with a random probability and
 * otherwise return success.
 */
async function applyUserRole(userId: string, userRole: UserRole): Promise<boolean> {
  maybeCrash(0.3);
  console.log(`>>> Applied role ${userRole.roleKey} for user ${userId}`);
  return true;
}

/*
 * This function would call the service or API to apply a permission.
 * For the sake of this example, we just fail with a random probability
 * and otherwise return success.
 */
async function applyPermission(userId: string, permission: Permission): Promise<void> {
  maybeCrash(0.2);
  console.log(`>>> Applied permission ${permission.permissionKey}:${permission.setting} for user ${userId}`);
}
