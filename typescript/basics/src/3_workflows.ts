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
import * as restateClients from "@restatedev/restate-sdk-clients";
import { createUserEntry, sendEmailWithLink } from "./utils/workflow_stubs";

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
const myWorkflow = restate.workflow({
  // --- The workflow logic is in the run() function ---
  name: "usersignup",
  handlers: {
    run: async (ctx: restate.WorkflowContext, params: { name: string; email: string }) => {
      const {name, email} = params;

      // publish state, for the world to see our progress
      ctx.set("stage", "Creating User");

      // use all the standard durable execution features here
      await ctx.run(() => createUserEntry({name, email}));

      ctx.set("stage", "Email Verification");

      // send the email with the verification secret
      const secret = ctx.rand.uuidv4();
      await ctx.run(() => sendEmailWithLink({email, secret}));

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

    getStage: (ctx: restate.WorkflowSharedContext) => {
      // read the state to get the stage where the workflow is
      return ctx.get("stage");
    },

    verifyEmail: async (ctx: restate.WorkflowSharedContext, request: { secret: string }) => {
      // resolve the durable promise to let the awaiter know
      await ctx.promise<string>("email-link").resolve(request.secret);
    },

    abortVerification: async (ctx: restate.WorkflowSharedContext) => {
      // failing the durable promise will throw an Error for the awaiting thread
      await ctx.promise<string>("email-link").reject("User aborted verification");
    },
  }
});

restate.endpoint().bind(myWorkflow).listen();

export type WorkflowApi = typeof myWorkflow;

// ---------- ⬆️⬆️ deploy this as a container, lambda, etc. ⬆️⬆️ ----------

// start it via an HTTP call.
// curl localhost:8080/usersignup/signup-userid1/run/send --json '{ "name": "Bob", "email": "bob@builder.com" }'
//
// Resolve the email link via:
// curl localhost:8080/usersignup/signup-userid1/verifyEmail
// Abort the email verification via:
// curl localhost:8080/usersignup/signup-userid1/abortVerification

// or programmatically
async function signupUser(userId: string, name: string, email: string) {
  const rs = restateClients.connect({ url: "http://restate:8080" });
  const workflow: WorkflowApi = { name: "usersignup" };
  const workflowClient = rs.workflowClient(workflow, "signup-" + userId);
  const { status } = await workflowClient.workflowSubmit({
    name,
    email,
  });

  if (status != "Accepted") {
    throw new Error("User ID already taken");
  }

  await workflowClient.workflowAttach();
}

// interact with the workflow  from any other code
async function verifyEmail(userId: string, emailSecret: string) {
  const rs = restateClients.connect({ url: "http://restate:8080" });
  const workflow: WorkflowApi = { name: "usersignup" };
  const workflowClient = rs.workflowClient(workflow, "signup-" + userId);

  workflowClient.verifyEmail({ secret: emailSecret });
}
