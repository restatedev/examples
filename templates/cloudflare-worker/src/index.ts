import { Context, endpoint, service } from "@restatedev/restate-sdk/cloudflare";

// Template of a Restate service and handler
//
// Have a look at the TS QuickStart to learn how to run this: https://docs.restate.dev/get_started/quickstart?sdk=ts
//

const greet = async (ctx: Context, greeting: string) => {
  return `${greeting}!`;
};

export default endpoint()
  .bind(
    service({
      name: "Greeter",
      handlers: { greet },
    }),
  )
  .handler();
