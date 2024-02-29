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
import { workflow as wf } from "@restatedev/restate-sdk";
import { createUserEntry, sendEmailWithLink } from "./utils/workflow_stubs";
import { WorkflowStartResult } from "@restatedev/restate-sdk/dist/workflows/workflow";

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
const myWorkflow = wf.workflow("usersignup", {

    // --- The workflow logic is in the run() function ---

    run: async (ctx: wf.WfContext, params: { name: string, email: string} ) => {
        const { name, email } = params;
        const userId = ctx.workflowId();

        // publish state, for the world to see our progress
        ctx.set("stage", "Creating User");

        // use all the standard durable execution features here
        await ctx.sideEffect(() => createUserEntry({ userId, name }));
    
        ctx.set("stage", "Email Verification");

        // send the email with the verification secret
        const secret = await ctx.sideEffect(async () => crypto.randomUUID());        
        ctx.sideEffect(() => sendEmailWithLink({ email, secret }));
        
        try {
            // the promise here is resolved or rejected by the additional workflow methods below
            const clickSecret = await ctx.promise<string>("email-link");
            if (clickSecret !== secret) {
                throw new restate.TerminalError("Wrong secret from email link");
            }
        } catch (err: any) {
            ctx.set("stage", "Verification failed: " + err.message);
            return;
        }

        ctx.set("stage", "User verified");
    },

    // --- various interactions for queries and signals ---

    getStage: (ctx: wf.SharedWfContext) => {
        // read the state to get the stage where the workflow is
        return ctx.get("stage");
    },

    verifyEmail: async (ctx: wf.SharedWfContext, request: { secret: string }) => {
        // resolve the durable promise to let the awaiter know
        ctx.promise<string>("email-link").resolve(request.secret);
    },

    abortVerification: async (ctx: wf.SharedWfContext) => {
        // failing the durable promise will throw an Error for the awaiting thread
        ctx.promise<string>("email-link").fail("User aborted verification");
    },
})

export const workflowApi = myWorkflow.api;

// ---------- ⬆️⬆️ deploy this as a container, lambda, etc. ⬆️⬆️ ----------


// start it via an HTTP call.
// `curl restate:8080/usersignup/submit --json '{ "request": {
//                                                   "workflowId": "signup-userid1",
//                                                   "name": "Bob",
//                                                   "email": "bob@builder.com"
//                                               } }'

// or programatically
async function signupUser(userId: string, name: string, email: string) {
    const rs = restate.clients.connect("http://restate:8080");
    const { client, status } = await rs.submitWorkflow(workflowApi, "signup-" + userId, { name, email });

    if (status != WorkflowStartResult.STARTED) {
        throw new Error("User ID already taken");
    }
    
    await client.result();
}

// interact with the workflow  from any other code
async function verifyEmail(userId: string, emailSecret: string) {
    const rs = restate.clients.connect("http://restate:8080");
    const { client, status } = await rs.connectToWorkflow(workflowApi, "signup-" + userId);

    client.workflowInterface().verifyEmail({ secret: emailSecret });
}
