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

const client = new athena.AthenaClient({});

const DEFAULT_QUERY_SQL = 'SELECT sum("table"."value") AS answer FROM "demo_db"."table"';

export const publicApi: restate.ServiceApi<typeof queryRouter> = {
  path: "query",
};

const query = async (ctx: restate.RpcContext, query?: string) => {
  const requestId = ctx.rand.uuidv4(); // make up a stable idempotency token for calling Athena API

  const executionId = await ctx.sideEffect(async () => {
    try {
      const startQueryResult = await client.send(
        new athena.StartQueryExecutionCommand({
          QueryString: query ?? DEFAULT_QUERY_SQL,
          WorkGroup: "demo-workgroup",
          ClientRequestToken: requestId,
        }),
      );
      return startQueryResult.QueryExecutionId as string;
    } catch (error) {
      if (error instanceof athena.AthenaServiceException)
        if (error.$fault === "client") throw new restate.TerminalError(error.message);

      throw error; // rethrow other exceptions -- side effect retry policy will handle them
    }
  });
  const queryId = { QueryExecutionId: executionId };

  const state = await ctx.sideEffect(async () => {
    const response = await client.send(new athena.GetQueryExecutionCommand(queryId));
    const state = response.QueryExecution?.Status?.State;
    if (!state || !isQueryStateFinal(state)) throw new Error("Non-final state"); // trigger retry of side effect
    return state;
  });

  if (state !== "SUCCEEDED") {
    throw new restate.TerminalError(`Query execution failed: ${state}. Please see logs for error details.`);
  }

  const result = await ctx.sideEffect(() => client.send(new athena.GetQueryResultsCommand(queryId)));
  return { result: result.ResultSet, _id: executionId };
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
  query,
  // query: mockQuery,
});

restate.createServer().bindRouter(publicApi.path, queryRouter).listen(9080);

function isQueryStateFinal(state: athena.QueryExecutionState): boolean {
  return ["SUCCEEDED", "FAILED", "CANCELLED"].includes(state);
}
