package virtual_objects

import dev.restate.sdk.annotation.Handler
import dev.restate.sdk.annotation.VirtualObject
import dev.restate.sdk.http.vertx.RestateHttpServer
import dev.restate.sdk.kotlin.*
import dev.restate.sdk.kotlin.endpoint.endpoint

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
//
@VirtualObject
class GreeterObject {

  companion object {
    // Reference to the K/V state stored in Restate
    private val COUNT = stateKey<Int>("greet-count")
  }

  @Handler
  suspend fun greet(ctx: ObjectContext, greeting: String): String  {
    // Access the state attached to this object (this 'name')
    // State access and updates are exclusive and consistent with the invocations
    val count = ctx.get(COUNT) ?: 0
    val newCount = count + 1
    ctx.set(COUNT, newCount)

    return "$greeting ${ctx.key()}, for the $newCount-th time"
  }

  @Handler
  suspend fun ungreet(ctx: ObjectContext): String {
    val count = ctx.get(COUNT) ?: 0
    if (count > 0) {
      val newCount = count - 1
      ctx.set(COUNT, newCount)
    }

    return "Dear ${ctx.key()}, taking one greeting back: $count"
  }
}


fun main() {
  RestateHttpServer.listen(endpoint {
    bind(GreeterObject())
  })
}

/*
Check the README to learn how to run Restate.
Then, invoke handlers via HTTP:

curl localhost:8080/GreeterObject/mary/greet -H 'content-type: application/json' -d '"Hi"'
  --> "Hi mary for the 1-th time."

curl localhost:8080/GreeterObject/barack/greet -H 'content-type: application/json' -d '"Hello"'
  --> "Hello barack for the 1-th time."

curl -X POST localhost:8080/GreeterObject/mary/ungreet
  --> "Dear mary, taking one greeting back: 0."

 */

