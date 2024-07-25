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
public class SignupWorkflow {

    // References to K/V state and promises stored in Restate
    private static final DurablePromiseKey<String> EMAIL_CLICKED =
            DurablePromiseKey.of("email_clicked", JsonSerdes.STRING);
    private static final StateKey<String> ONBOARDING_STATUS =
            StateKey.of("status", JsonSerdes.STRING);

    @Workflow
    public boolean run(WorkflowContext ctx, User user) {

        // Durably executed action; write to other system
        ctx.run(() -> createUserEntry(user));

        // Store some K/V state; can be retrieved from other handlers
        ctx.set(ONBOARDING_STATUS, "Created user");

        // Sent user email with verification link
        String secret = ctx.random().nextUUID().toString();
        ctx.run(() -> sendEmailWithLink(user.getEmail(), secret));
        ctx.set(ONBOARDING_STATUS, "Verifying user");

        // Wait until user clicked email verification link
        // Resolved or rejected by the other handlers
        String clickSecret =
                ctx.promise(EMAIL_CLICKED)
                        .awaitable()
                        .await();
        ctx.set(ONBOARDING_STATUS, "Link clicked");

        return clickSecret.equals(secret);
    }


    @Shared
    public void click(SharedWorkflowContext ctx, String secret) {
        // Resolve the promise with the result secret
        ctx.promiseHandle(EMAIL_CLICKED).resolve(secret);
    }

    @Shared
    public String getStatus(SharedWorkflowContext ctx) {
        // Get the onboarding status of the user
        return ctx.get(ONBOARDING_STATUS).orElse("Unknown");
    }


    public static void main(String[] args) {
        RestateHttpEndpointBuilder.builder()
                .bind(new SignupWorkflow())
                .buildAndListen();
    }
}