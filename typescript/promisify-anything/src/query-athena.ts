import * as restate from "@restatedev/restate-sdk";
import * as athena from "@aws-sdk/client-athena";
import * as dynamodb from "@aws-sdk/client-dynamodb";

const QUERY_SQL = `
    SELECT sum("table"."value") AS answer
    FROM "demo_db"."table"
`;

export default async function queryAthena(ctx: restate.RpcContext, query?: string) {
  const requestId = ctx.rand.uuidv4(); // make up a stable idempotency token for calling Athena API

  const athenaClient = new athena.AthenaClient({});
  const startQueryOutput = await ctx.sideEffect(
    terminateOnError(
      (error) => (error instanceof athena.AthenaServiceException ? error.$fault === "client" : false),
      async () =>
        await athenaClient.send(
          new athena.StartQueryExecutionCommand({
            QueryString: query ?? QUERY_SQL,
            WorkGroup: "demo-workgroup",
            ClientRequestToken: requestId,
          }),
        ),
    ),
  );
  const queryExecutionId = { QueryExecutionId: startQueryOutput.QueryExecutionId! };

  // Polling-based approach to query status
  // const state = await ctx.sideEffect(async () =>
  //   assertFinalState((await athenaClient.send(new athena.GetQueryExecutionCommand(queryExecutionId))).QueryExecution?.Status?.State),
  // );

  const awakable = ctx.awakeable<string>();

  const ddbClient = new dynamodb.DynamoDBClient({});
  const item = await ctx.sideEffect(async () => {
    return await ddbClient.send(
      new dynamodb.PutItemCommand({
        TableName: process.env["TABLE_NAME"]!,
        Item: {
          pk: { S: startQueryOutput.QueryExecutionId! },
          sk: { S: "QueryExecutionId" },
          awakableId: { S: awakable.id },
        },
        ConditionExpression: "attribute_not_exists(pk)",
      }),
    );
  });
  console.log(
    `Created awakable ${awakable.id} for query execution ${queryExecutionId.QueryExecutionId} (DDB requestId: ${item.$metadata.requestId})`,
  );

  const state = await awakable.promise;
  console.log(`Awakable resolved with state: '${state}'`);

  if (state !== "SUCCEEDED") {
    throw new restate.TerminalError(`Query execution failed: ${state}. Please see logs for error details.`);
  }

  const result = await ctx.sideEffect(() => athenaClient.send(new athena.GetQueryResultsCommand(queryExecutionId)));
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
