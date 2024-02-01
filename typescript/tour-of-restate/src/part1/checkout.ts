/*
 * Copyright (c) 2023 - Restate Software, Inc., Restate GmbH
 *
 * This file is part of the Tour of Restate Typescript handler API,
 * which is released under the MIT license.
 *
 * You can find a copy of the license in the file LICENSE
 * in the root directory of this repository or package or at
 * https://github.com/restatedev/tour-of-restate
 */

import * as restate from "@restatedev/restate-sdk";

const checkout = async (
  ctx: restate.RpcContext,
  request: { userId: string; tickets: string[] },
) => {
  return true;
};

export const checkoutRouter = restate.router({ checkout });

export const checkoutApi: restate.ServiceApi<typeof checkoutRouter> = {
  path: "Checkout",
};
