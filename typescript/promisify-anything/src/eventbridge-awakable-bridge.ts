import { Handler } from "aws-lambda";
import { EventBridgeEvent } from "aws-lambda/trigger/eventbridge";
import * as dynamodb from "@aws-sdk/client-dynamodb";

// See https://docs.aws.amazon.com/athena/latest/ug/athena-events.html
interface AthenaEvent {
  versionId: string;
  currentState: string;
  previousState: string;
  statementType: string;
  queryExecutionId: string;
  workgroupName: string;
  sequenceNumber: string;
}

const ddbClient = new dynamodb.DynamoDBClient({});

export const handler: Handler = async (event: EventBridgeEvent<"Athena Query State Change", AthenaEvent>) => {
  console.log("Received event: ", JSON.stringify(event, null, 2));

  if (["SUCCEEDED", "FAILED", "CANCELLED"].includes(event.detail.currentState)) {
    // fetch the awakable id from DynamoDB
    const item = await ddbClient.send(
      new dynamodb.GetItemCommand({
        TableName: process.env["TABLE_NAME"]!,
        Key: {
          pk: { S: event.detail.queryExecutionId },
          sk: { S: "QueryExecutionId" },
        },
      }),
    );

    const awakableId = item.Item?.["awakableId"].S;
    if (awakableId) {
      const body = JSON.stringify({
        id: awakableId,
        json_result: event.detail.currentState,
      });

      console.log(`Resolving awakable: ${awakableId} with state ${event.detail.currentState}: ${body}`);

      const restateResponse = await fetch(process.env["RESTATE_CALLBACK_URL"]! + "/dev.restate.Awakeables/Resolve", {
        method: "POST",
        body: body,
        headers: {
          "Content-Type": "application/json",
        },
      });

      console.log(`Got response from restate (${restateResponse.status}): ${await restateResponse.text()}`);
    } else {
      console.warn("No awakable found for queryExecutionId: ", event.detail.queryExecutionId);
    }
  }
};
