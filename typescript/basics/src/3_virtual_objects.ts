import * as restate from "@restatedev/restate-sdk";

// Virtual Objects hold K/V state and have methods to interact with the object.
// An object is identified by a unique id - only one object exists per id.
//
// Virtual Objects have their K/V state locally accessible without requiring any database
// connection or lookup. State is exclusive, and atomically committed with the
// method execution.
//
// Virtual Objects are Stateful (Serverless) constructs.
//
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

restate.endpoint().bind(greeterObject).listen(9080);
// or .handler() to run on Lambda, Deno, Bun, Cloudflare Workers, ...

/*
Check the README to learn how to run Restate.
Then, invoke handlers via HTTP:

  curl localhost:8080/greeter/mary/greet -H 'content-type: application/json' -d '{ "greeting" : "Hi" }'
  --> "Hi mary for the 1-th time."

  curl localhost:8080/greeter/barack/greet -H 'content-type: application/json' -d '{"greeting" : "Hello" }'
  --> "Hello barack for the 1-th time."

  curl -X POST localhost:8080/greeter/mary/ungreet
  --> "Dear mary, taking one greeting back: 0."

*/
