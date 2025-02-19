mod stubs;

use crate::stubs::{create_user_entry, send_email_with_link, User};
use restate_sdk::prelude::*;

// Workflow are a special type of Virtual Object with a run handler that runs once per ID.
// Workflows are stateful and can be interacted with via queries (getting data out of the workflow)
// and signals (pushing data to the workflow).
//
// Workflows are used to model long-running flows, such as user onboarding, order processing, etc.
// Workflows have the following handlers:
//  - Main workflow in run() method
//  - Additional methods interact with the workflow.
// Each workflow instance has a unique ID and runs only once (to success or failure).

#[restate_sdk::workflow]
trait SignupWorkflow {
    async fn run(user: Json<User>) -> Result<bool, HandlerError>;
    #[shared]
    async fn click(secret: String) -> Result<(), HandlerError>;
}

struct SignupWorkflowImpl;

impl SignupWorkflow for SignupWorkflowImpl {
    // --- The workflow logic ---
    async fn run(
        &self,
        mut ctx: WorkflowContext<'_>,
        Json(user): Json<User>,
    ) -> Result<bool, HandlerError> {
        // Durably executed action; write to other system
        ctx.run(|| create_user_entry(&user)).await?;

        // Send the email with the verification link
        let secret = ctx.rand_uuid().to_string();
        // workflow ID = user ID; workflow runs once per user
        let user_id = ctx.key();
        ctx.run(|| send_email_with_link(user_id, &user, &secret))
            .await?;

        // Wait until user clicked email verification link
        // Promise gets resolved or rejected by the other handlers
        let click_secret = ctx.promise::<String>("email-link").await?;
        Ok(click_secret == secret)
    }

    // --- Other handlers interact with the workflow via queries and signals ---
    async fn click(
        &self,
        ctx: SharedWorkflowContext<'_>,
        secret: String,
    ) -> Result<(), HandlerError> {
        ctx.resolve_promise::<String>("email-link", secret);
        Ok(())
    }
}

#[tokio::main]
async fn main() {
    tracing_subscriber::fmt::init();

    HttpServer::new(Endpoint::builder().bind(SignupWorkflowImpl.serve()).build())
        .listen_and_serve("0.0.0.0:9080".parse().unwrap())
        .await;
}

/*
Check the README to learn how to run Restate.
- Then, submit the workflow via HTTP:
  curl localhost:8080/SignupWorkflow/userid1/run/send -H 'content-type: application/json' -d '{ "name": "Bob", "email": "bob@builder.com" }'

- Resolve the email link via:
  curl localhost:8080/SignupWorkflow/userid1/click -H 'content-type: application/json' -d '"<SECRET>"'

- Attach back to the workflow to get the result:
  curl localhost:8080/restate/workflow/SignupWorkflow/userid1/attach
*/
