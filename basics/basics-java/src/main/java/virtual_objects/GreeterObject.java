package virtual_objects;

import dev.restate.sdk.ObjectContext;
import dev.restate.sdk.annotation.Handler;
import dev.restate.sdk.annotation.VirtualObject;
import dev.restate.sdk.common.CoreSerdes;
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
            StateKey.of("available-drivers", CoreSerdes.JSON_INT);

    @Handler
    public String greet(ObjectContext ctx, String greeting) {

        // Access the state attached to this object (this 'name')
        // State access and updates are exclusive and consistent with the invocations
        int count = ctx.get(COUNT).orElse(0);
        int newCount = count + 1;
        ctx.set(COUNT, newCount);

        return String.format( "%s %s, for the %d-th time", greeting, ctx.key(), count);
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
// Example1: `curl localhost:8080/greeter/mary/greet   -H 'content-type: application/json' -d '{ "greeting" : "Hi" }'`;
// Example2: `curl localhost:8080/greeter/barack/greet   -H 'content-type: application/json' -d '{"greeting" : "Hello" }'`;
// Example3: `curl localhost:8080/greeter/mary/ungreet -H 'content-type: application/json' -d '{}'`;