import * as restate from "@restatedev/restate-sdk";

// Template of a Restate virtual object and handler
//
// Have a look at the TS QuickStart to learn how to run this: https://docs.restate.dev/get_started/quickstart?sdk=ts
//

export const exampleObject = restate.object({
    name: "ExampleObject",
    handlers: {
        greet: async (ctx: restate.ObjectContext) => {
          const count = (await ctx.get<number>("count")) ?? 0;
          ctx.set("count", count + 1);
          return `Hello ${ctx.key}! Counter: ${count}`;
        }
    },
})
