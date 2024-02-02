/*
 * Copyright (c) 2023 - Restate Software, Inc., Restate GmbH
 *
 * This file is part of the Tour of Restate Typescript handler API,
 * which is released under the MIT license.
 *
 * You can find a copy of the license in the file LICENSE
 * in the root directory of this repository or package or at
 * https://github.com/restatedev/tour-of-restate-typescript
 */

import * as restate from "@restatedev/restate-sdk";
import queryAthena from "./query-athena";

export const publicApi: restate.ServiceApi<typeof queryRouter> = {
  path: "query",
};

// If you want to test client retries and idempotent request processing without an AWS stack, you can replace the
// handler definition above in the queryRouter with the following simple mock instead:
const mockQuery = async (ctx: restate.RpcContext) => {
  await ctx.sleep(2000); // simulate a long-running query
  return {
    result: { Rows: [{ Data: [{ VarCharValue: "answer" }] }, { Data: [{ VarCharValue: "fake" }] }] },
    _id: ctx.rand.uuidv4(),
  };
};

export const queryRouter = restate.router({
  query: queryAthena,
  // query: mockQuery,
});

restate.createServer().bindRouter(publicApi.path, queryRouter).listen(9080);
