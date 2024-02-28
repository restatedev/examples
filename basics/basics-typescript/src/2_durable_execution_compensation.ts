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
import { UpdateRequest, UserRole, Permission} from "./utils/example_stubs";
import { getCurrentRole, tryApplyUserRole, tryApplyPermission} from "./utils/example_stubs";

// Durable execution ensures code runs to the end, even in the presence of
// failures. That allows developers to implement error handling with common
// control flow in code.
//
//  - This example uses the SAGA pattern: on error, the code undos previous
//    operations in reverse order
//  - The code uses common exception handling and variables/arrays to remember
//    the previous values to restore
//

async function applyRoleUpdate(ctx: restate.Context, update: UpdateRequest) {
  // parameters are durable across retries
  const { userId, role, permissons } = update;

  // regular failures are re-tries, TerminalErrors are propagated
  // nothing applied so far, so we propagate the error directly
  const previousRole = await ctx.sideEffect(() => getCurrentRole(userId));
  await ctx.sideEffect(() => tryApplyUserRole(userId, role));

  // apply all permissions in order
  // we collect the previous permission settings to reset if the process fails
  const previousPermissions: Permission[] = []
  for (const permission of permissons) {
    try {
      const previous = await ctx.sideEffect(() => tryApplyPermission(userId, permission));
      previousPermissions.push(previous); // remember the previous setting
    } catch (err) {
      if (err instanceof restate.TerminalError) {
        await rollback(ctx, userId, previousRole, previousPermissions);
      }
      throw err;
    }
  }
}

async function rollback(ctx: restate.Context, userId: string, role: UserRole, permissions: Permission[]) {
  console.log(">>> !!! ROLLING BACK CHANGES !!! <<<");
  for (const prev of permissions.reverse()) {
    await ctx.sideEffect(() => tryApplyPermission(userId, prev));
  }
  await ctx.sideEffect(() => tryApplyUserRole(userId, role));
}


// ---------------------------- deploying / running ---------------------------

const serve = restate
  .endpoint()
  .bindRouter("roleUpdate", restate.router({ applyRoleUpdate }))

serve.listen(9080);
// or serve.lambdaHandler();
// or serve.http2Handler();
// or ...


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
