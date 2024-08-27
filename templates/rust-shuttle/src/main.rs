use restate_sdk::prelude::*;

// Restate shuttle integration
mod restate_shuttle;
use restate_shuttle::RestateShuttleEndpoint;

#[restate_sdk::service]
trait Greeter {
    async fn greet(name: String) -> HandlerResult<String>;
}

struct GreeterImpl;

impl Greeter for GreeterImpl {
    async fn greet(&self, _: Context<'_>, name: String) -> HandlerResult<String> {
        Ok(format!("Greetings {name}"))
    }
}

#[shuttle_runtime::main]
async fn main() -> Result<RestateShuttleEndpoint, shuttle_runtime::Error> {
    Ok(RestateShuttleEndpoint::new(
        Endpoint::builder()
            .with_service(GreeterImpl.serve())
            .build(),
    ))
}
