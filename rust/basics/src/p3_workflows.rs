mod utils;

use restate_sdk::prelude::*;
use crate::utils::{create_user_entry, send_email_with_link, User};

#[restate_sdk::workflow]
pub trait SignupWorkflow {
    async fn run(user: Json<User>) -> Result<bool, HandlerError>;
    #[shared]
    async fn click(secret: String) -> Result<(), HandlerError>;
}

pub struct SignupWorkflowImpl;

impl SignupWorkflow for SignupWorkflowImpl {
    async fn run(&self, mut ctx: WorkflowContext<'_>, Json(user): Json<User>) -> Result<bool, HandlerError> {

        ctx.run(|| create_user_entry(&user)).await?;

        let secret = ctx.rand_uuid().to_string();
        let user_id = ctx.key();
        ctx.run(|| send_email_with_link(user_id, &user, &secret)).await?;

        let click_secret = ctx.promise::<String>("email-link").await?;
        Ok(click_secret == secret)
    }

    async fn click(&self, ctx: SharedWorkflowContext<'_>, secret: String) -> Result<(), HandlerError> {
        ctx.resolve_promise::<String>("email-link", secret);
        Ok(())
    }
}

#[tokio::main]
async fn main() {
    tracing_subscriber::fmt::init();

    HttpServer::new(
        Endpoint::builder()
            .bind(SignupWorkflowImpl.serve())
            .build(),
    )
    .listen_and_serve("0.0.0.0:9080".parse().unwrap())
    .await;
}

/*
Check the README to learn how to run Restate.
- Then, submit the workflow via HTTP:
  curl localhost:8080/SignupWorkflow/userid1/run/send -H 'content-type: application/json' -d '{ "name": "Bob", "email": "bob@builder.com" }'

- Resolve the email link via:
  curl localhost:8080/SignupWorkflow/userid1/click -H 'content-type: application/json' -d '{ "secret": "xxx"}'

- Attach back to the workflow to get the result:
  curl localhost:8080/restate/workflow/SignupWorkflow/userid1/attach
*/