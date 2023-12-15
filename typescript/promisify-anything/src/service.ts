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
import * as athena from "@aws-sdk/client-athena";

export const publicApi: restate.ServiceApi<typeof queryRouter> = {
  path: "query",
};
export const internalApi: restate.ServiceApi<typeof internalAthenaApiRouter> = {
  path: "internal",
};

// Public API implementation

const query = async (ctx: restate.RpcContext, param: string) => {
  const uniqueId = ctx.rand.uuidv4();
  const awakeable = ctx.awakeable();

  ctx.send(internalApi).query(uniqueId, {
    awakeableId: awakeable.id,
    query: param,
  });

  return await awakeable.promise;
};

export const queryRouter = restate.router({
  query,
});

// Internal API implementation

const client = new athena.AthenaClient({});

type QueryRequest = {
  awakeableId: string;
  query: string;
};

const queryInternal = async (ctx: restate.RpcContext, requestId: string, request: QueryRequest) => {
  console.log("Starting query: " + request + " with id: " + requestId);

  // If you want to test the promise integration without actually calling Athena, you can just uncomment this instead:
  // await ctx.sleep(5000);
  // ctx.resolveAwakeable(request.awakeableId, { result: "foo", _id: requestId });
  // return;

  let executionId: string;
  try {
    executionId = (await ctx.sideEffect(async () => {
      const startQueryResult = await client.send(
        new athena.StartQueryExecutionCommand({
          QueryString: 'SELECT * FROM "demo_db"."table" limit 10;',
          WorkGroup: "demo-workgroup",
          ClientRequestToken: requestId,
        }),
      );
      return startQueryResult.QueryExecutionId;
    })) as string;
  } catch (err) {
    throw new restate.TerminalError("Unable to start query", { cause: err });
  }

  const results = await ctx.sideEffect(async () => {
    return await client.send(
      new athena.GetQueryResultsCommand({
        QueryExecutionId: executionId,
      }),
    );
  });

  ctx.resolveAwakeable(request.awakeableId, { result: results.ResultSet, _id: results.$metadata.requestId });
};

export const internalAthenaApiRouter = restate.keyedRouter({
  query: queryInternal,
});

restate
  .createServer()
  .bindRouter(publicApi.path, queryRouter)
  .bindKeyedRouter(internalApi.path, internalAthenaApiRouter)
  .listen(9080);
