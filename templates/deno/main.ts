import { Context, endpoint, service } from "npm:@restatedev/restate-sdk@^1.0.1/fetch";

// Template of a Restate service and handler
//
// Have a look at the TS QuickStart: https://docs.restate.dev/get_started/quickstart?sdk=ts
//

const greeter = service({
  name: "Greeter",
  handlers: {
    greet: async (ctx: Context, greeting: string) => {
      return `${greeting}!`;
    },
  },
});

const handler = endpoint().bind(greeter).handler();

Deno.serve({ port: 9080 }, handler.fetch);
