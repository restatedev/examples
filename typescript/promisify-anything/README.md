# Restate Promisify complex dependency example

This example shows how to use Restate to promisify a complex dependency, in this case executing queries on AWS Athena.
A long-polling HTTP client is set up to simulate long-polling against the Restate ingress endpoint that wraps a query's
result in a very simple promise. Using a consistent idempotency token turns this into a true durable promise.

## Running the example

Prerequisites:

- npm, jq, curl
- Docker
- [Optional] An AWS account where you can deploy a demo stack

There are several components to running the example:

- Restate (you will start a single-node local server)
- [Optional] An AWS stack with an S3 bucket and an Athena database
- A Restate service (provided)
- A promise "client" which uses long-polling with an idempotency key to await the completion of an operation

### Start Restate

If you prefer, you can omit the `--rm` flag to retain the stored invocation state between container restarts.

```shell
docker run --name restate_dev --rm -p 8080:8080 -p 9070:9070 -p 9071:9071 -e RUST_LOG=info,restate=debug docker.io/restatedev/restate:latest
```

### [Optional] Deploy the AWS stack

If you prefer not to deploy AWS resources, edit [service.ts](src/service.ts) and replace the Athena interactions with a
Restate context sleep call as suggested in the comments. This will simulate a long-running operation without any
external dependencies. Alternatively, make sure you have an active session with sufficient privileges and deploy the
demo stack:

```shell
npm run deploy
```

Note the value of the `BucketName` output. Now copy the sample data file into S3:

```shell
aws s3 cp data/sample.jsonl s3://${BUCKET_NAME}/data/
```

### Start the service

Use the `DemoRoleArn` output from the stack deployment above to set the `ROLE_ARN` environment variable:

```shell
output=$(aws sts assume-role --role-arn ${ROLE_ARN} --role-session-name restate-demo)
export AWS_ACCESS_KEY_ID=$(echo $output | jq -r '.Credentials.AccessKeyId')
export AWS_SECRET_ACCESS_KEY=$(echo $output | jq -r '.Credentials.SecretAccessKey')
export AWS_SESSION_TOKEN=$(echo $output | jq -r '.Credentials.SessionToken')
```

Now start the Restate service:

```shell
npm run service
```

Register the service with Restate - you only need to do this once:

```shell
curl -X POST http://localhost:9070/endpoints -H 'content-type: application/json' -d '{"uri": "http://host.docker.internal:9080"}'
```

### Run the client

To make the example more interesting, we set a relatively short timeout on the client connection which causes us to
disconnect and retry. This demonstrates the built-in idempotency support that makes it very easy to retry. Let's run the
client against the Restate ingress endpoint with `npm run client`. You should see the following output:

```
Starting query with idempotency key: 6pbxlpuwect ...
Attempt #1 failed with AxiosError: timeout of 500ms exceeded. Backing off for 225.4295680836923ms...
Attempt #2 failed with AxiosError: timeout of 500ms exceeded. Backing off for 421.82781013856396ms...
Query finished with status: 200.
{
  status: 'SUCCESS',
  result: {
    response: { _id: 'd69d08af-299f-4068-9bd2-42d11dca603a', result: [Object] }
  }
}
```

Let's look at the server logs: we see that the side effect wrapping the call to retrieve the query results has most
likely been retried several times because Athena takes some time to start, execute, and return the results of a query.
Our logic in the service handler didn't have to deal with any of that backing off - Restate did it all for us:

```
[restate] [2023-12-15T15:20:03.451Z] DEBUG: [query/query] [Ogrphy5abhwAYxuEC5ecQa5i7mwGNNa0g] : Invoking function.
[restate] [2023-12-15T15:20:03.458Z] DEBUG: [internal/query] [pua_tEavBlwAYxuEC58fyigRM4drFneMA] : Invoking function.
Starting query: [object Object] with id: 06d81b82-1a77-4eb2-ae0e-039828efff08
[restate] [2023-12-15T15:20:03.851Z] DEBUG: Error while executing side effect 'side-effect': InvalidRequestException - Query has not yet finished. Current state: QUEUED
[restate] [2023-12-15T15:20:03.852Z] DEBUG: InvalidRequestException: Query has not yet finished. Current state: QUEUED
...
...
...
[restate] [2023-12-15T15:20:03.995Z] DEBUG: Retrying in 40 ms
[restate] [2023-12-15T15:20:04.092Z] DEBUG: Error while executing side effect 'side-effect': InvalidRequestException - Query has not yet finished. Current state: RUNNING
[restate] [2023-12-15T15:20:04.099Z] DEBUG: InvalidRequestException: Query has not yet finished. Current state: RUNNING
...
...
...
[restate] [2023-12-15T15:20:04.452Z] DEBUG: Retrying in 320 ms
[restate] [2023-12-15T15:20:04.882Z] DEBUG: [internal/query] [pua_tEavBlwAYxuEC58fyigRM4drFneMA] : Function completed successfully.
[restate] [2023-12-15T15:20:04.905Z] DEBUG: [query/query] [Ogrphy5abhwAYxuEC5ecQa5i7mwGNNa0g] : Function completed successfully.
```

Notice how if you re-run the client with the same idempotency token as a previous run using `IDEMPOTENCY_KEY=${TOKEN} npm run client`,
the server will immediately return a cached result:

```
Starting query with idempotency key: 6pbxlpuwect ...
Query finished with status: 200.
{
  status: 'SUCCESS',
  result: {
    response: { _id: 'd69d08af-299f-4068-9bd2-42d11dca603a', result: [Object] }
  }
}
```

### Clean up

If you created an AWS stack you can destroy it using:

```shell
npx cdk destroy
```
