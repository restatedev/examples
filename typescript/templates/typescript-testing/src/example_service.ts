import * as restate from "@restatedev/restate-sdk";

// Template of a Restate service and handler
//
// Have a look at the TS QuickStart to learn how to run this: https://docs.restate.dev/get_started/quickstart?sdk=ts
//

export const exampleService = restate.service({
  name: "ExampleService",
  handlers: {
    greet: async (ctx: restate.Context, name: string) => {
      console.info("Hello there");
      return `Hello ${name}!`;
    },
  },
});
