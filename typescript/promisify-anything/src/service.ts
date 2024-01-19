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

const query = async (ctx: restate.RpcContext, request: string) => {
  const uniqueId = ctx.rand.uuidv4();
  const awakeable = ctx.awakeable();

  ctx.send(internalApi).query(uniqueId, {
    awakeableId: awakeable.id,
    query: request,
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
  query?: string;
};

const DEFAULT_QUERY_SQL = 'SELECT * FROM "demo_db"."table" limit 10;';

const queryInternal = async (ctx: restate.RpcContext, requestId: string, request: QueryRequest) => {
  const executionId = await ctx.sideEffect(async () => {
    const startQueryResult = await client.send(
      new athena.StartQueryExecutionCommand({
        QueryString: request.query ?? DEFAULT_QUERY_SQL,
        WorkGroup: "demo-workgroup",
        ClientRequestToken: requestId,
      }),
    );
    return startQueryResult.QueryExecutionId as string;
  });
  const queryId = { QueryExecutionId: executionId };

  const state = await ctx.sideEffect(
    async () => {
      const response = await client.send(new athena.GetQueryExecutionCommand(queryId));
      const state = response.QueryExecution?.Status?.State;
      if (!state || !isQueryStateFinal(state)) throw new Error("Non-final state"); // trigger retry of side effect
      return state;
    },
    {
      name: "Wait for query execution to reach final state",
    },
  );

  if (state !== "SUCCEEDED") {
    ctx.rejectAwakeable(request.awakeableId, "Unable to execute query");
    throw new restate.TerminalError("Unable to execute query");
  }

  const result = await ctx.sideEffect(() => client.send(new athena.GetQueryResultsCommand(queryId)));

  ctx.resolveAwakeable(request.awakeableId, { result: result.ResultSet, _id: result.$metadata.requestId });
};

export const internalAthenaApiRouter = restate.keyedRouter({
  query: queryInternal,
});

restate
  .createServer()
  .bindRouter(publicApi.path, queryRouter)
  .bindKeyedRouter(internalApi.path, internalAthenaApiRouter)
  .listen(9080);

function isQueryStateFinal(state: athena.QueryExecutionState): boolean {
  return ["SUCCEEDED", "FAILED", "CANCELLED"].includes(state);
}

// If you want to test the promise integration without actually calling Athena, you can replace the service definition
// above with the following simple mock instead:
// const queryInternal = async (ctx: restate.RpcContext, requestId: string, request: QueryRequest) => {
//   await ctx.sleep(5000);
//   ctx.resolveAwakeable(request.awakeableId, { result: "foo", _id: requestId });
//   return;
// };
