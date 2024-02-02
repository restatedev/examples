# Promisify anything: wrap a complex dependency in a durable promise

This example shows how to use Restate to promisify a complex dependency, in this case executing queries on AWS Athena.
A long-polling HTTP client is set up to simulate long-polling against the Restate ingress endpoint that wraps a query's
result in a very simple promise. Using a consistent idempotency token turns this into a true durable promise.

## Running the example

Prerequisites:

- npm
- supported Restate OS environment (macOS, Linux, Docker)
- [Optional] An AWS account where you can deploy a demo stack

There are several components to running the example:

- Restate (you will start a single-node local server)
- [Optional] An AWS stack with an S3 bucket and an Athena database
- A Restate service (provided)
- A promise "client" which uses long-polling with an idempotency key to await the completion of an operation

### Start Restate

In a separate terminal, start a Restate server:

```shell
npx @restatedev/restate-server
```

Note: the server keeps a persistent store of previous invocations, stored state, idempotency keys in a directory named
`target`. If you would later like to drop the stored state without needing to re-register the service deployment again,
you can relaunch the server with the `--wipe worker` flag.

### [Optional] Deploy the AWS stack

If you prefer not to deploy AWS resources, edit [service.ts](src/service.ts) and replace the Athena interactions with a
Restate context sleep call as suggested in the comments. This will simulate a long-running operation without any
external dependencies. Alternatively, make sure you have an active session with sufficient privileges and deploy the
demo stack:

```shell
npm run deploy
```

Next, copy the sample data file into S3:

```shell
BUCKET_NAME=$(aws cloudformation describe-stacks \
  --stack-name AthenaTableStack --query "Stacks[0].Outputs[?OutputKey=='BucketName'].OutputValue" --output text)

aws s3 cp data/sample.jsonl s3://${BUCKET_NAME}/data/
```

You can confirm that the file landed under the `data/` prefix using the S3 console or the CLI using
`aws s3 ls s3://${BUCKET_NAME}/data/`.

### Start the service

#### Obtain service AWS credentials

The restate service houses the Athena adapter logic and requires AWS credentials. We can use short-term credentials from
the AWS demo stack we deployed earlier. If you've chosen to skip AWS integration, make sure you've commented out the AWS
SDK interactions and skip ahead to running the service.

The easiest way to configure your service to operate under the IAM Role we create for the purpose in the AWS stack is to
create a profile. In your `~/.aws/config` file, create a new section that looks like this:

```
[profile restate-demo]
source_profile = {{profile for the account where you deployed the stack}}
role_arn = {{role ARN from the stack output}}
region = {{region where you deployed the stack}}
```

You can name the profile anything you like; set the `source_profile` to the name of the profile you use to access AWS -
this is probably your default profile that you used to deploy the CDK stack earlier. Specify the profile to use by
setting the `AWS_PROFILE` environment variable:

```shell
export AWS_PROFILE=restate-demo
```

You can proceed to run the service. If you don't want to create an AWS profile, you can use the following commands to
obtain short-term credentials and make them available via environment variables instead:

```shell
ROLE_ARN=$(aws cloudformation describe-stacks \
  --stack-name AthenaTableStack --query "Stacks[0].Outputs[?OutputKey=='DemoRoleArn'].OutputValue" --output text)

export $(printf "AWS_ACCESS_KEY_ID=%s AWS_SECRET_ACCESS_KEY=%s AWS_SESSION_TOKEN=%s" \
    $(aws sts assume-role \
        --role-arn ${ROLE_ARN} \
        --role-session-name restate-demo \
        --query "Credentials.[AccessKeyId,SecretAccessKey,SessionToken]" \
        --output text))
```

If you ordinarily use an AWS credential profile with the CLI, you should unset that; you must also make sure that your
preferred region is specified:

```shell
unset AWS_PROFILE
export AWS_REGION=...
```

#### Running the service

You can verify that you've obtained the correct short-term AWS credentials with `aws sts get-caller-identity` - it should
report a valid session under the assumed "DemoDbAccess" role.

Now start the Restate service:

```shell
npm run service
```

In a new terminal, register the service with the Restate server - you only need to do this once; the registration will
be persisted across Restate server and service restarts until you wipe the Restate meta state. 

```shell
npx @restatedev/restate deployments register --yes localhost:9080
```

### Run the client

To make the example more interesting, we set a relatively short timeout on the client connection which causes us to
disconnect and retry. This demonstrates the built-in idempotency support that makes it very easy to retry. Let's run the
client against the Restate ingress endpoint with `npm run client`. You should see the following output:

```
% npm run client
...
Starting query with idempotency key: xkmwm95dxln ...
Attempt #1 failed with: AxiosError: timeout of 500ms exceeded. Backing off for 230.90111823134313ms...
Attempt #2 failed with: AxiosError: timeout of 500ms exceeded. Backing off for 437.00865138660356ms...
Attempt #3 failed with: AxiosError: timeout of 500ms exceeded. Backing off for 934.4729307670398ms...
Query finished with status: 200.
Response: answer = ...
```

Let's look at the server logs: we see that the side effect wrapping the call to retrieve the query results has most
likely been retried several times because Athena takes some time to start, execute, and return the results of a query.
Our logic in the service handler didn't have to deal with any of that backing off - Restate did it all for us:

```
[restate] [2024-02-02T13:12:22.736Z] DEBUG: [query/query] [xOUF1k8jX60AY1p8uXId_O58UCosW6etQ] : Invoking function.
[restate] [2024-02-02T13:12:24.607Z] DEBUG: Error while executing side effect 'side-effect': Error - Non-final state
[restate] [2024-02-02T13:12:24.619Z] DEBUG: Error: Non-final state
...
[restate] [2024-02-02T13:12:24.620Z] DEBUG: Retrying in 10 ms
[restate] [2024-02-02T13:12:24.837Z] DEBUG: Error while executing side effect 'side-effect': Error - Non-final state
...
...
[restate] [2024-02-02T13:12:25.051Z] DEBUG: Retrying in 320 ms
[restate] [2024-02-02T13:12:25.542Z] DEBUG: [query/query] [xOUF1k8jX60AY1p8uXId_O58UCosW6etQ] : Function completed successfully.
```

Notice how if you re-run the client with the same idempotency token as that of a previous run
using `npm run client -- ${TOKEN}`, the server will immediately return a cached result:

```
% npm run client -- xkmwm95dxln
...
Starting query with idempotency key: xkmwm95dxln ...
Query finished with status: 200.
Response: answer = ...
```

### Clean up

If you created an AWS stack you can destroy it using:

```shell
npx cdk destroy
```
