import * as restate from "@restatedev/restate-sdk";

// Template of a Restate service and handler
//
// Have a look at the TS QuickStart to learn how to run this: https://docs.restate.dev/get_started/quickstart?sdk=ts
//

const greet = async (ctx: restate.Context, greeting: string) => {
  return `${greeting}!`;
};

// Create the Restate server to accept requests
restate
  .endpoint()
  .bind(
    restate.service({
      name: "Greeter",
      handlers: { greet },
    })
  )
  .listen(9080);
