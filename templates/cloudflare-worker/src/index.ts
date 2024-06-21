import { Context, endpoint, service } from "@restatedev/restate-sdk/fetch";

// Template of a Restate service and handler
//
// Have a look at the TS QuickStart: https://docs.restate.dev/get_started/quickstart?sdk=ts
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
