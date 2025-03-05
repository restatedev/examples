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
package workflows;

import dev.restate.sdk.JsonSerdes;
import dev.restate.sdk.SharedWorkflowContext;
import dev.restate.sdk.WorkflowContext;
import dev.restate.sdk.annotation.Shared;
import dev.restate.sdk.annotation.Workflow;
import dev.restate.sdk.common.DurablePromiseKey;
import dev.restate.sdk.common.StateKey;
import dev.restate.sdk.http.vertx.RestateHttpEndpointBuilder;
import utils.User;

import static utils.ExampleStubs.createUserEntry;
import static utils.ExampleStubs.sendEmailWithLink;

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
public class SignupWorkflow {

    // References to K/V state and promises stored in Restate
    private static final DurablePromiseKey<String> EMAIL_CLICKED =
            DurablePromiseKey.of("email_clicked", JsonSerdes.STRING);

    // --- The workflow logic ---
    @Workflow
    public boolean run(WorkflowContext ctx, User user) {
        // workflow ID = user ID; workflow runs once per user
        String userId = ctx.key();

        // Durably executed action; write to other system
        ctx.run(() -> createUserEntry(user));

        // Sent user email with verification link
        String secret = ctx.random().nextUUID().toString();
        ctx.run(() -> sendEmailWithLink(userId, user, secret));

        // Wait until user clicked email verification link
        // Promise gets resolved or rejected by the other handlers
        String clickSecret =
                ctx.promise(EMAIL_CLICKED)
                        .awaitable()
                        .await();

        return clickSecret.equals(secret);
    }


    // --- Other handlers interact with the workflow via queries and signals ---
    @Shared
    public void click(SharedWorkflowContext ctx, String secret) {
        // Send data to the workflow via a durable promise
        ctx.promiseHandle(EMAIL_CLICKED).resolve(secret);
    }

    public static void main(String[] args) {
        RestateHttpEndpointBuilder.builder()
                .bind(new SignupWorkflow())
                .buildAndListen();
    }
}

/*
Check the README to learn how to run Restate.
- Then, submit the workflow via HTTP:
  curl localhost:8080/SignupWorkflow/userid1/run/send -H 'content-type: application/json' -d '{ "name": "Bob", "email": "bob@builder.com" }'

- Resolve the email link via:
  curl localhost:8080/SignupWorkflow/userid1/click -H 'content-type: application/json' -d '"<SECRET>"'

- Attach back to the workflow to get the result:
  curl -X POST localhost:8080/restate/workflow/SignupWorkflow/userid1/attach
*/
