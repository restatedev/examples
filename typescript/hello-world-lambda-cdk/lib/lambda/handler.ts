import * as restate from "@restatedev/restate-sdk";

export const handler = restate
  .createLambdaApiGatewayHandler()
  .bindRouter("Greeter", restate.router({ greet: async () => "Hello!" }))
  .handle();
