import * as restate from "@restatedev/restate-sdk";

//  -----------------                                         -----------------
//                         Idempotent DynamoDB update
//  -----------------                                         -----------------

// Data stores that support idempotent updates can be integrated very easily to
// achieve exactly-once semantics. This example demonstrates how we might do
// that with Amazon DynamoDB.

// In this example, we perform an idempotent insert into DynamoDB in a way that
// would be much harder with stateless compute alone. As long as the caller
// invokes Restate idempotently, the DynamoDB operation will be performed
// exactly once. How does Restate help? TODO.

export async function idempotentInsert(ctx: restate.RpcContext, request: unknown, dynamoDb: DynamoDBClient): Promise<void> {
    const item = parseAndValidateInput(request);

    // deterministic idempotency token
    const idempotencyToken = ctx.rand.uuidv4();

    // A restart of the Restate handler will re-try the DynamoDB operation with the same idempotency token, ensuring
    // that the commit only takes effect in DynamoDB once.
    await ctx.sideEffect(() => {
        return dynamoDb.transactWriteItems({
            clientRequestToken: idempotencyToken,
            items: [
                {
                    Put: {
                        TableName: "table",
                        Item: item,
                    },
                },
            ],
        });
    });

    return;
}

function parseAndValidateInput(input: unknown): object {
    // perform validation on the raw input
    return input as object;
}

// ----------------------------------------------------------------------------
// To avoid a dependency on the AWS SDK, we've defined a minimal interface here
// that replicates the DynamoDB API.

interface PutItem {
    Put: {
        TableName: string;
        Item: object;
    }
}
interface UpdateItem {
    Update: {
        TableName: string;
        Item: object;
    }
}
interface DeleteItem {
    Delete: {
        TableName: string;
        key: object;
    }
}

type DynamoDBOperation = PutItem | UpdateItem | DeleteItem;

interface DynamoDBClient {
    transactWriteItems(request: {
        clientRequestToken: string;
        items: DynamoDBOperation[];
    }): Promise<void>;
}
