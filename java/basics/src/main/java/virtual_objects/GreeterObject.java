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

//
// Virtual Objects hold state and have methods to interact with the object.
// An object is identified by a unique id - only one object exists per id.
//
// Virtual Objects have their state locally accessible without requiring any database
// connection or lookup. State is exclusive, and atomically committed with the
// method execution.
//
// Virtual Objects are _Stateful Serverless_ constructs.
//

@VirtualObject
public class GreeterObject {

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

        return "Dear " + ctx.key() + ", taking one greeting back: " + count;
    }

    public static void main(String[] args) {
        RestateHttpEndpointBuilder.builder()
            .bind(new GreeterObject())
            .buildAndListen();
    }
}

// See README for details on how to start and connect to Restate.
// Call this service through HTTP directly the following way:
// Example1: `curl localhost:8080/GreeterObject/mary/greet -H 'content-type: application/json' -d '"Hi"'`;
// Example2: `curl localhost:8080/GreeterObject/barack/greet -H 'content-type: application/json' -d '"Hello"'`;
// Example3: `curl localhost:8080/GreeterObject/mary/ungreet -H 'content-type: application/json' -d ''`;