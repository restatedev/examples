package workflows

import dev.restate.sdk.annotation.Shared
import dev.restate.sdk.annotation.Workflow
import dev.restate.sdk.http.vertx.RestateHttpServer
import dev.restate.sdk.kotlin.*
import dev.restate.sdk.kotlin.endpoint.endpoint
import utils.*

// Workflow are a special type of Virtual Object with a run handler that runs once per ID.
// Workflows are stateful and can be interacted with via queries (getting data out of the workflow)
// and signals (pushing data to the workflow).
//
// Workflows are used to model long-running flows, such as user onboarding, order processing, etc.
// Workflows have the following handlers:
//  - Main workflow in run() method
//  - Additional methods interact with the workflow.
// Each workflow instance has a unique ID and runs only once (to success or failure).
//
@Workflow
class SignupWorkflow {

  companion object {
    // References to K/V state and promises stored in Restate
    private val LINK_CLICKED = durablePromiseKey<String>("email_clicked")
  }

  @Workflow
  suspend fun run(ctx: WorkflowContext, user: User): Boolean {
    // workflow ID = user ID; workflow runs once per user
    val userId = ctx.key()

    // Durably executed action; write to other system
    ctx.runBlock { createUserEntry(user) }

    // Sent user email with verification link
    val secret = ctx.random().nextUUID().toString()
    ctx.runBlock { sendEmailWithLink(userId, user, secret) }

    // Wait until user clicked email verification link
    // Promise gets resolved or rejected by the other handlers
    val clickSecret: String =
      ctx.promise(LINK_CLICKED)
        .future()
        .await()

    return clickSecret == secret
  }

  // --- Other handlers interact with the workflow via queries and signals ---
  @Shared
  suspend fun click(ctx: SharedWorkflowContext, secret: String) {
    // Send data to the workflow via a durable promise
    ctx.promiseHandle(LINK_CLICKED).resolve(secret)
  }
}

fun main() {
  RestateHttpServer.listen(endpoint {
    bind(SignupWorkflow())
  })
}

/*
Check the README to learn how to run Restate.
- Then, submit the workflow via HTTP:
  curl localhost:8080/SignupWorkflow/userid1/run/send -H 'content-type: application/json' -d '{ "name": "Bob", "email": "bob@builder.com" }'

- Resolve the email link via / Copy it over from the service log of executing the first command:
  curl localhost:8080/SignupWorkflow/userid1/click -H 'content-type: application/json' -d '"<SECRET>"'

- Attach back to the workflow to get the result:
  curl localhost:8080/restate/workflow/SignupWorkflow/userid1/attach
*/
