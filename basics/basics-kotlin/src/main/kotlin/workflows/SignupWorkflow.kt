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
package workflows

import dev.restate.sdk.annotation.Handler
import dev.restate.sdk.annotation.Shared
import dev.restate.sdk.annotation.VirtualObject
import dev.restate.sdk.annotation.Workflow
import dev.restate.sdk.http.vertx.RestateHttpEndpointBuilder
import dev.restate.sdk.kotlin.*
import utils.*

//
// A simple workflow for a user signup and email verification.
//
//  - the main workflow is in the run() method
//  - any number of other methods can be added to implement interactions
//    with the workflow.
//
// Workflow instances always have a unique ID that identifies the workflow execution.
// Each workflow instance (ID) can run only once (to success or failure).
//
@Workflow
class SignupWorkflow {
  @Workflow
  suspend fun run(ctx: WorkflowContext, user: User): Boolean {
    // Durably executed action; write to other system
    ctx.runBlock { createUserEntry(user) }

    // Store some K/V state; can be retrieved from other handlers
    ctx.set(ONBOARDING_STATUS, "Created user")

    // Sent user email with verification link
    val secret = ctx.random().nextUUID().toString()
    ctx.runBlock { sendEmailWithLink(user.email, secret) }
    ctx.set(ONBOARDING_STATUS, "Verifying user")

    // Wait until user clicked email verification link
    // Resolved or rejected by the other handlers
    val clickSecret: String =
      ctx.promise(EMAIL_CLICKED)
        .awaitable()
        .await()
    ctx.set(ONBOARDING_STATUS, "Link clicked")

    return clickSecret == secret
  }


  @Shared
  suspend fun click(ctx: SharedWorkflowContext, secret: String) {
    // Resolve the promise with the result secret
    ctx.promiseHandle(EMAIL_CLICKED).resolve(secret)
  }

  // Get the onboarding status of the user
  @Shared
  suspend fun getStatus(ctx: SharedWorkflowContext) =
    ctx.get(ONBOARDING_STATUS) ?: "Unknown"

}

private val EMAIL_CLICKED = KtDurablePromiseKey.json<String>("email_clicked")
private val ONBOARDING_STATUS = KtStateKey.json<String>("status")

fun main() {
  RestateHttpEndpointBuilder.builder()
    .bind(SignupWorkflow())
    .buildAndListen()
}
