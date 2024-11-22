use std::time::Duration;
use restate_sdk::prelude::*;

// Restate shuttle integration
mod restate_shuttle;
mod utils;

use restate_shuttle::RestateShuttleEndpoint;
use utils::{send_notification, send_reminder};

#[restate_sdk::service]
trait Greeter {
    async fn greet(name: String) -> HandlerResult<String>;
}

struct GreeterImpl;

impl Greeter for GreeterImpl {
    async fn greet(&self, mut ctx: Context<'_>, name: String) -> HandlerResult<String> {
        // Durably execute a set of steps; resilient against failures
        let greeting_id = ctx.rand_uuid().to_string();
        ctx.run(|| send_notification(&greeting_id, &name)).await?;
        ctx.sleep(Duration::from_millis(1000)).await?;
        ctx.run(|| send_reminder(&greeting_id)).await?;

        // Respond to caller
        Ok(format!("Greetings {name}"))
    }
}

#[shuttle_runtime::main]
async fn main() -> Result<RestateShuttleEndpoint, shuttle_runtime::Error> {
    Ok(RestateShuttleEndpoint::new(
        Endpoint::builder()
            .bind(GreeterImpl.serve())
            .build(),
    ))
}
