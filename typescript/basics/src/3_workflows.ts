import * as restate from "@restatedev/restate-sdk";
import * as restateClients from "@restatedev/restate-sdk-clients";
import { createUserEntry, sendEmailWithLink } from "./utils/stubs";

// Implement long-running workflows with Restate.
// For example, a user signup and email verification workflow.
//  - Main workflow in run() method
//  - Additional methods interact with the workflow.
// Each workflow instance has a unique ID and runs only once (to success or failure).
//
const signupWorkflow = restate.workflow({
  name: "usersignup",
  handlers: {
    // --- The workflow logic ---
    run: async (
      ctx: restate.WorkflowContext,
      user: { name: string; email: string },
    ) => {
      // workflow ID = user ID; workflow runs once per user
      const userId = ctx.key;

      // Durably executed action; write to other system
      await ctx.run(() => createUserEntry(user));

      // Send the email with the verification link
      const secret = ctx.rand.uuidv4();
      await ctx.run(() => sendEmailWithLink({ userId, user, secret }));

      // Wait until user clicked email verification link
      // Promise gets resolved or rejected by the other handlers
      const clickSecret = await ctx.promise<string>("email-link");
      return clickSecret === secret;
    },

    // --- Other handlers interact with the workflow via queries and signals ---
    click: async (
      ctx: restate.WorkflowSharedContext,
      request: { secret: string },
    ) => {
      // Send data to the workflow via a durable promise
      await ctx.promise<string>("email-link").resolve(request.secret);
    },
  },
});

export type SignupApi = typeof signupWorkflow;

restate.endpoint().bind(signupWorkflow).listen(9080);
// or .handler() to run on Lambda, Deno, Bun, Cloudflare Workers, ...

/*
Check the README to learn how to run Restate.
- Then, submit the workflow via HTTP:
  curl localhost:8080/usersignup/userid1/run/send -H 'content-type: application/json' -d '{ "name": "Bob", "email": "bob@builder.com" }'

- Resolve the email link via:
  curl localhost:8080/usersignup/userid1/click -H 'content-type: application/json' -d '{ "secret": "xxx"}'

- Attach back to the workflow to get the result:
  curl localhost:8080/restate/workflow/usersignup/userid1/attach
*/

// or programmatically
async function signupUser(userId: string, name: string, email: string) {
  const rs = restateClients.connect({ url: "http://restate:8080" });
  const workflowClient = rs.workflowClient<SignupApi>(
    { name: "usersignup" },
    userId,
  );
  const response = await workflowClient.workflowSubmit({ name, email });

  if (response.status != "Accepted") {
    throw new Error("User ID already taken");
  }

  const userVerified = await workflowClient.workflowAttach();
}

// interact with the workflow  from any other code
async function verifyEmail(userId: string, emailSecret: string) {
  const rs = restateClients.connect({ url: "http://restate:8080" });
  const workflowClient = rs.workflowClient<SignupApi>(
    { name: "usersignup" },
    userId,
  );

  await workflowClient.click({ secret: emailSecret });
}
