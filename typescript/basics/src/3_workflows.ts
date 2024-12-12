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
import { createUserEntry, sendEmailWithLink } from "./utils/stubs";

//
// Workflow for user signup and email verification.
//  - Main workflow in run() method
//  - Additional methods interact with the workflow.

// Each workflow instance has a unique ID and runs only once (to success or failure).
//
const myWorkflow = restate.workflow({
  name: "usersignup",
  handlers: {
    // --- The workflow logic ---
    run: async (ctx: restate.WorkflowContext, params: { name: string; email: string }) => {
      const {name, email} = params;
      // You can use all the standard durable execution features here
      await ctx.run(() => createUserEntry({name, email}));

      // Send the email with the verification secret
      const secret = ctx.rand.uuidv4();
      await ctx.run(() => sendEmailWithLink({email, secret}));

      // The promise here is resolved or rejected by the additional workflow methods below
      const clickSecret = await ctx.promise<string>("email-link");
      return clickSecret === secret;
    },

    // --- Other handlers interact with the workflow via queries and signals ---
    verifyEmail: async (ctx: restate.WorkflowSharedContext, request: { secret: string }) => {
      // send data to the workflow via a durable promise
      await ctx.promise<string>("email-link").resolve(request.secret);
    },
  }
});

export type SignupApi = typeof myWorkflow;

restate.endpoint().bind(myWorkflow).listen();
// ---------- ⬆️⬆️ deploy this as a container, lambda, etc. ⬆️⬆️ ----------

// Submit the workflow via HTTP:
// curl localhost:8080/usersignup/userid1/run/send --json '{ "name": "Bob", "email": "bob@builder.com" }'
//
// Resolve the email link via:
// curl localhost:8080/usersignup/userid1/verifyEmail
// Abort the email verification via:
// curl localhost:8080/usersignup/userid1/abortVerification

// or programmatically
async function signupUser(userId: string, name: string, email: string) {
  const rs = restateClients.connect({ url: "http://restate:8080" });
  const workflowClient = rs.workflowClient<SignupApi>({ name: "usersignup" }, userId);
  const response = await workflowClient.workflowSubmit({ name, email });

  if (response.status != "Accepted") {
    throw new Error("User ID already taken");
  }

  const userVerified = await workflowClient.workflowAttach();
}

// interact with the workflow  from any other code
async function verifyEmail(userId: string, emailSecret: string) {
  const rs = restateClients.connect({ url: "http://restate:8080" });
  const workflowClient = rs.workflowClient<SignupApi>({ name: "usersignup" }, userId);

  await workflowClient.verifyEmail({ secret: emailSecret });
}
