/*
 * Copyright (c) 2024 - Restate Software, Inc., Restate GmbH
 *
 * This file is part of the Restate Examples
 * which is released under the MIT license.
 *
 * You can find a copy of the license in the file LICENSE
 * in the root directory of this repository or package or at
 * https://github.com/restatedev/examples/blob/main/LICENSE
 */
package virtual_objects;

import dev.restate.sdk.JsonSerdes;
import dev.restate.sdk.ObjectContext;
import dev.restate.sdk.annotation.Handler;
import dev.restate.sdk.annotation.VirtualObject;
import dev.restate.sdk.common.StateKey;
import dev.restate.sdk.http.vertx.RestateHttpEndpointBuilder;

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
public class GreeterObject {

    // Reference to the K/V state stored in Restate
    private static final StateKey<Integer> COUNT =
            StateKey.of("count", JsonSerdes.INT);

    @Handler
    public String greet(ObjectContext ctx, String greeting) {

        // Access the state attached to this object (this 'name')
        // State access and updates are exclusive and consistent with the invocations
        int count = ctx.get(COUNT).orElse(0);
        int newCount = count + 1;
        ctx.set(COUNT, newCount);

        return String.format( "%s %s, for the %d-th time", greeting, ctx.key(), newCount);
    }

    @Handler
    public String ungreet(ObjectContext ctx) {
        int count = ctx.get(COUNT).orElse(0);
        if(count > 0){
            int newCount = count - 1;
            ctx.set(COUNT, newCount);
        }

        return String.format("Dear %s, taking one greeting back: %d", ctx.key(), count);
    }

    public static void main(String[] args) {
        RestateHttpEndpointBuilder.builder()
            .bind(new GreeterObject())
            .buildAndListen();
    }
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
