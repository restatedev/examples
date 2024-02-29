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
import { UpdateRequest, applyUserRole, applyPermission } from "./utils/example_stubs";

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

async function applyRoleUpdate(ctx: restate.Context, update: UpdateRequest) {
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

// ---------------------------- deploying / running ---------------------------

const serve = restate.endpoint().bindRouter("roleUpdate", restate.router({ applyRoleUpdate }));

serve.listen(9080);
// or serve.lambdaHandler();
// or serve.http2Handler();
// or ...

//
// See README for details on how to start and connect Restate.
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
