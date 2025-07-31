import * as restate from "@restatedev/restate-sdk";

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

const greeterObject = restate.object({
  name: "greeter",
  handlers: {
    greet: async (ctx: restate.ObjectContext, req: { greeting: string }) => {
      // Access the state attached to this object (this 'name')
      // State access and updates are exclusive and consistent with the execution progress.
      let count = (await ctx.get<number>("count")) ?? 0;
      count++;
      ctx.set("count", count);
      return `${req.greeting} ${ctx.key} for the ${count}-th time.`;
    },

    ungreet: async (ctx: restate.ObjectContext) => {
      let count = (await ctx.get<number>("count")) ?? 0;
      if (count > 0) {
        count--;
      }
      ctx.set("count", count);
      return `Dear ${ctx.key}, taking one greeting back: ${count}.`;
    },
  },
});

restate.serve({
  services: [greeterObject],
  port: 9080,
});
// or createEndpointHandler() to run on Lambda, Deno, Bun, Cloudflare Workers, ...

/*
You specify which object you want to invoke by including its key in the URL path:
localhost:8080/objectName/key/handlerName

Check the README to learn how to run Restate.
Then, invoke handlers via HTTP:

  curl localhost:8080/greeter/mary/greet -H 'content-type: application/json' -d '{ "greeting" : "Hi" }'
  --> "Hi mary for the 1-th time."

  curl localhost:8080/greeter/barack/greet -H 'content-type: application/json' -d '{"greeting" : "Hello" }'
  --> "Hello barack for the 1-th time."

  curl -X POST localhost:8080/greeter/mary/ungreet
  --> "Dear mary, taking one greeting back: 0."

*/
