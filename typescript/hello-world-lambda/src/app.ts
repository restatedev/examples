/*
 * Copyright (c) 2023 - Restate Software, Inc., Restate GmbH
 *
 * This file is part of the Restate Examples for the Node.js/TypeScript SDK,
 * which is released under the MIT license.
 *
 * You can find a copy of the license in the file LICENSE
 * in the root directory of this repository or package or at
 * https://github.com/restatedev/examples/blob/main/LICENSE
 */

import * as restate from "@restatedev/restate-sdk";

const doGreet = async (ctx: restate.RpcContext, name: string) => {
  return `Hello ${name} :-)`;
};

const doGreetAndRemember = async (ctx: restate.RpcContext, name: string) => {
  let seen = (await ctx.get<number>("seen")) ?? 0;
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
  .bindKeyedRouter("Greeter", router)
  .handle();
