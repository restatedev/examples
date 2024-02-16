import * as restate from "@restatedev/restate-sdk";
import * as athena from "@aws-sdk/client-athena";

const QUERY_SQL = `
    SELECT sum("table"."value") AS answer
    FROM "demo_db"."table"
`;

export default async function queryAthena(ctx: restate.RpcContext, query?: string) {
  const requestId = ctx.rand.uuidv4(); // make up a stable idempotency token for calling Athena API

  const client = new athena.AthenaClient({});
  const startQueryOutput = await ctx.sideEffect(
    terminateOnError(
      (error) => (error instanceof athena.AthenaServiceException ? error.$fault === "client" : false),
      async () =>
        await client.send(
          new athena.StartQueryExecutionCommand({
            QueryString: query ?? QUERY_SQL,
            WorkGroup: "demo-workgroup",
            ClientRequestToken: requestId,
          }),
        ),
    ),
  );
  const queryId = { QueryExecutionId: startQueryOutput.QueryExecutionId };

  const state = await ctx.sideEffect(async () =>
    assertFinalState((await client.send(new athena.GetQueryExecutionCommand(queryId))).QueryExecution?.Status?.State),
  );

  if (state !== "SUCCEEDED") {
    throw new restate.TerminalError(`Query execution failed: ${state}. Please see logs for error details.`);
  }

  const result = await ctx.sideEffect(() => client.send(new athena.GetQueryResultsCommand(queryId)));
  return { result: result.ResultSet, _id: startQueryOutput };
}

function terminateOnError<T>(isTerminal: (e: Error) => boolean, fn: () => Promise<T>): () => Promise<T> {
  return async () => {
    try {
      return await fn();
    } catch (e) {
      if (e instanceof Error && isTerminal(e)) throw new restate.TerminalError(e.message);
      throw e;
    }
  };
}

class RetryableError extends Error {}

function assertFinalState(state?: athena.QueryExecutionState): athena.QueryExecutionState {
  if (state == undefined || !["SUCCEEDED", "FAILED", "CANCELLED"].includes(state)) {
    throw new RetryableError(`Non-final state ${state ?? "undefined"}`);
  }
  return state;
}
