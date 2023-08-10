import * as restate from "@restatedev/restate-sdk";

const doGreet = async (ctx: restate.RestateContext, name: string) => {
  return `Hello ${name} :-)`;
};

const doGreetAndRemember = async (
  ctx: restate.RestateContext,
  name: string,
) => {
  let seen = (await ctx.get<number>("seen")) || 0;
  seen += 1;

  ctx.set("seen", seen);
  return `Hello ${name} for the #${seen} time :-)`;
};

const router = restate.keyedRouter({
  greet: doGreet,
  greetAndRemember: doGreetAndRemember,
});

export const handler = restate
  .createLambdaApiGatewayHandler()
  .bindKeyedRouter("greeter", router)
  .handle();
