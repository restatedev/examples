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
import { UpdateRequest, UserRole, Permission } from "./utils/example_stubs";
import {
  getCurrentRole,
  tryApplyUserRole,
  tryApplyPermission,
} from "./utils/example_stubs";

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
  const { userId, role, permissions: permissions } = update;

  // Restate does retries for regular failures.
  // TerminalErrors, on the other hand, are not retried and are propagated
  // back to the caller.
  // No permissions were applied so far, so if this fails,
  // we propagate the error directly back to the caller.
  const previousRole = await ctx.run(() => getCurrentRole(userId));
  await ctx.run(() => tryApplyUserRole(userId, role));

  // Apply all permissions in order.
  // We collect the previous permission settings to reset if the process fails.
  const previousPermissions: Permission[] = [];
  for (const permission of permissions) {
    try {
      const previous = await ctx.run(() =>
        tryApplyPermission(userId, permission),
      );
      previousPermissions.push(previous); // remember the previous setting
    } catch (err) {
      if (err instanceof restate.TerminalError) {
        await rollback(ctx, userId, previousRole, previousPermissions);
      }
      throw err;
    }
  }
}

async function rollback(
  ctx: restate.Context,
  userId: string,
  role: UserRole,
  permissions: Permission[],
) {
  console.log(">>> !!! ROLLING BACK CHANGES !!! <<<");
  for (const prev of permissions.reverse()) {
    await ctx.run(() => tryApplyPermission(userId, prev));
  }
  await ctx.run(() => tryApplyUserRole(userId, role));
}

// ---------------------------- deploying / running ---------------------------
import { service } from "@restatedev/restate-sdk";

const serve = restate.endpoint().bind(
  service({
    name: "roleUpdate",
    handlers: { applyRoleUpdate },
  }),
);

serve.listen(9080);
// or serve.http2Handler();
// or serve.handler() from "@restatedev/restate-sdk/lambda" or "@restatedev/restate-sdk/fetch"
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
// Once an action has completed, it does not get re-executed on retries, so each line occurs only once.

/*
curl localhost:8080/roleUpdate/applyRoleUpdate -H 'content-type: application/json' -d \
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
