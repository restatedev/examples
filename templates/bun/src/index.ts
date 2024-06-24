import { Context, endpoint, service } from "@restatedev/restate-sdk/fetch";

// Template of a Restate service and handler
//
// Have a look at the TS QuickStart: https://docs.restate.dev/get_started/quickstart?sdk=ts
//

const greeter = service({
  name: "greeter",
  handlers: {
    greet: async (ctx: Context, greeting: string) => {
      return `${greeting}!`;
    },
  },
});

const handler = endpoint().bind(greeter).handler();

const server = Bun.serve({
  port: 9080,
  ...handler,
});

console.log(`Listening on ${server.url}`);
