use restate_sdk::prelude::*;

#[restate_sdk::object]
pub trait GreeterObject {
    async fn greet(req: String) -> Result<String, HandlerError>;
    async fn ungreet() -> Result<String, HandlerError>;
}
// Virtual Objects are services that hold K/V state. Its handlers interact with the object state.
// An object is identified by a unique id - only one object exists per id.
//
// To guarantee state consistency, only one handler is executed at a time per Virtual Object (ID).
//
// Handlers are stateless executors.
// Restate proxies requests to it and attaches the object's state to the request.
// Virtual Objects then have their K/V state locally accessible without requiring any database
// connection or lookup. State is exclusive, and atomically committed with the
// method execution. It is always consistent with the progress of the execution.
//
// Virtual Objects are Stateful (Serverless) constructs.

pub struct GreeterObjectImpl;

impl GreeterObject for GreeterObjectImpl {
    async fn greet(&self, ctx: ObjectContext<'_>, greeting: String) -> Result<String, HandlerError> {
        // Access the state attached to this object (this 'name')
        // State access and updates are exclusive and consistent with the execution progress.
        let mut count = ctx.get::<u64>("count").await?.unwrap_or(0);
        count += 1;
        ctx.set("count", count);
        Ok(format!("{} {} for the {}-th time.", greeting, ctx.key(), count))
    }

    async fn ungreet(&self, ctx: ObjectContext<'_>) -> Result<String, HandlerError> {
        let mut count: u64 = ctx.get::<u64>("count").await?.unwrap_or(0);
        if count > 0 {
            count -= 1;
        }
        ctx.set("count", count);
        Ok(format!("Dear {}, taking one greeting back: {}.", ctx.key(), count))
    }
}

#[tokio::main]
async fn main() {
    tracing_subscriber::fmt::init();

    HttpServer::new(
        Endpoint::builder()
            .bind(GreeterObjectImpl.serve())
            .build(),
    )
        .listen_and_serve("0.0.0.0:9080".parse().unwrap())
        .await;
}

/*
You specify which object you want to invoke by including its key in the URL path:
localhost:8080/objectName/key/handlerName

Check the README to learn how to run Restate.
Then, invoke handlers via HTTP:

  curl localhost:8080/GreeterObject/mary/greet -H 'content-type: application/json' -d '"Hi"'
  --> "Hi mary for the 1-th time."

  curl localhost:8080/GreeterObject/barack/greet -H 'content-type: application/json' -d '"Hello"'
  --> "Hello barack for the 1-th time."

  curl -X POST localhost:8080/GreeterObject/mary/ungreet
  --> "Dear mary, taking one greeting back: 0."

*/
