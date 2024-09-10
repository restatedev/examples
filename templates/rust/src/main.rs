use restate_sdk::prelude::*;

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

#[tokio::main]
async fn main() {
    // To enable logging
    tracing_subscriber::fmt::init();

    HttpServer::new(
        Endpoint::builder()
            .bind(GreeterImpl.serve())
            .build(),
    )
        .listen_and_serve("0.0.0.0:9080".parse().unwrap())
        .await;
}