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
package durable_execution_compensation

import dev.restate.sdk.annotation.Handler
import dev.restate.sdk.annotation.Service
import dev.restate.sdk.common.TerminalException
import dev.restate.sdk.http.vertx.RestateHttpEndpointBuilder
import dev.restate.sdk.kotlin.*
import org.apache.logging.log4j.LogManager
import utils.*

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
class RoleUpdateService {
  @Handler
  suspend fun applyRoleUpdate(ctx: Context, update: UpdateRequest) {
    // Restate does retries for regular failures.
    // TerminalErrors, on the other hand, are not retried and are propagated
    // back to the caller.
    // No permissions were applied so far, so if this fails,
    // we propagate the error directly back to the caller.

    // We save in this list all the compensation actions
    val compensationActions = mutableListOf<suspend () -> Unit>()

    var previousRole = ctx.runBlock { getCurrentRole(update.userId) }

    try {
      // Apply user role and register the compensation action
      ctx.runBlock { tryApplyUserRole(update.userId, update.role) }
      compensationActions += {
        ctx.runBlock {
          tryApplyUserRole(update.userId, previousRole)
        }
      }

      for (permission in update.permissions) {
        // Apply permission and register compensation action
        val previousPermission = ctx.runBlock { tryApplyPermission(update.userId, permission) }
        compensationActions += {
          ctx.runBlock { tryApplyPermission(update.userId, previousPermission) }
        }
      }
    }  catch (err: TerminalException) {
      logger.info(">>>  !!! ROLLING BACK CHANGES for user ID: ${update.userId}")
      // Run compensations
      for (compensationAction in compensationActions.reversed()) {
        compensationAction()
      }
      // Throw TerminalException again to fail the processing
      throw err
    }
  }

  companion object {
    private val logger =
      LogManager.getLogger(RoleUpdateService::class.java)
  }
}

fun main() {
  RestateHttpEndpointBuilder.builder()
    .bind(RoleUpdateService())
    .buildAndListen()
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

