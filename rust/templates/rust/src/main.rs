mod utils;

use restate_sdk::prelude::*;
use std::time::Duration;
use utils::{send_notification, send_reminder};

struct Greeter;

#[restate_sdk::service]
impl Greeter {
    #[handler]
    async fn greet(&self, mut ctx: Context<'_>, name: String) -> Result<String, HandlerError> {
        // Durably execute a set of steps; resilient against failures
        let greeting_id = ctx.rand_uuid().to_string();
        ctx.run(|| send_notification(&greeting_id, &name))
            .name("notification")
            .await?;
        ctx.sleep(Duration::from_secs(1)).await?;
        ctx.run(|| send_reminder(&greeting_id, &name))
            .name("reminder")
            .await?;

        // Respond to caller
        Ok(format!("You said hi to {name}"))
    }
}

#[tokio::main]
async fn main() {
    // To enable logging
    tracing_subscriber::fmt::init();

    HttpServer::new(Endpoint::builder().bind(Greeter).build())
        .listen_and_serve("0.0.0.0:9080".parse().unwrap())
        .await;
}
