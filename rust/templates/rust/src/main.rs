mod utils;

use restate_sdk::prelude::*;
use std::time::Duration;
use utils::{send_notification, send_reminder};

#[restate_sdk::service]
trait Greeter {
    async fn greet(name: String) -> Result<String, HandlerError>;
}

#[restate_sdk::service]
trait GreeterFailure {
    async fn greet(name: String) -> Result<String, HandlerError>;
}


struct GreeterImpl;
struct GreeterFailureImpl;

impl Greeter for GreeterImpl {
    async fn greet(&self, mut ctx: Context<'_>, name: String) -> Result<String, HandlerError> {
        // Durably execute a set of steps; resilient against failures
        let greeting_id = ctx.rand_uuid().to_string();
        ctx.run(|| send_notification(&greeting_id, &name, false)).await?;
        ctx.sleep(Duration::from_millis(1000)).await?;
        ctx.run(|| send_reminder(&greeting_id, false)).await?;

        // Respond to caller
        Ok(format!("Greetings {name}"))
    }
}

impl GreeterFailure for GreeterFailureImpl {
    async fn greet(&self, mut ctnx: Context<'_>, name: String) -> Result<String, HandlerError> {
        // Durably execute a set of steps; resilient against failures
        let greeting_id = ctx.rand_uuid().to_string();
        ctx.run(|| send_notification(&greeting_id, &name, true)).await?;
        ctx.sleep(Duration::from_millis(1000)).await?;
        ctx.run(|| send_reminder(&greeting_id, true)).await?;

        // Respond to caller
        Ok(format!("Greetings {name}"))
    }
}


#[tokio::main]
async fn main() {
    // To enable logging
    tracing_subscriber::fmt::init();

    HttpServer::new(
        Endpoint::builder()
            .bind(GreeterImpl.serve())
            .bind(GreeterFailureImpl.serve())
            .build(),
    )
        .listen_and_serve("0.0.0.0:9080".parse().unwrap())
        .await;
}
