import * as restate from "@restatedev/restate-sdk";
import * as athena from "@aws-sdk/client-athena";

const QUERY_SQL = `
    SELECT sum("table"."value") AS answer
    FROM "demo_db"."table"
`;

export default async function queryAthena(ctx: restate.RpcContext, query?: string) {
  const requestId = ctx.rand.uuidv4(); // make up a stable idempotency token for calling Athena API

  const client = new athena.AthenaClient({});
  const executionId = await ctx.sideEffect(async () => {
    try {
      const startQueryResult = await client.send(
        new athena.StartQueryExecutionCommand({
          QueryString: query ?? QUERY_SQL,
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
}

function isQueryStateFinal(state: athena.QueryExecutionState): boolean {
  return ["SUCCEEDED", "FAILED", "CANCELLED"].includes(state);
}
