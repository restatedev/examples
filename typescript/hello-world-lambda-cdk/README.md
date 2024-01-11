# Hello world - TypeScript Lambda (CDK) example

Sample project deploying a TypeScript-based Restate service to AWS Lambda using the AWS Cloud Development Kit (CDK).
This is functionally equivalent to the [`hello-world-lambda`](../hello-world-lambda) example but uses CDK to automate
the deployment of the Lambda function to AWS, and to register the service with a Restate environment.

For more information on CDK, please see [Getting started with the AWS CDK](https://docs.aws.amazon.com/cdk/v2/guide/getting_started.html).

* [CDK app entry point `lambda-ts-cdk.ts`](bin/lambda-ts-cdk.ts)
* [CDK stack consisting of a Lambda function and providing Restate service registration](lib/lambda-ts-cdk-stack.ts)
* [TypeScript Lambda handler](lib/lambda/app.ts) - based on [`hello-world-lambda`](../hello-world-lambda)

## Download the example

```shell
wget https://github.com/restatedev/examples/releases/latest/download/typescript-hello-world-lambda-cdk.zip && unzip typescript-hello-world-lambda-cdk.zip -d typescript-hello-world-lambda-cdk && rm typescript-hello-world-lambda-cdk.zip
```

## Deploy

**Pre-requisites:**

* npm
* Restate Cloud access (cluster id + API token)
* AWS account, bootstrapped for CDK use

Create a secret in Secrets Manager to hold the authentication token. The secret name is up to you -- we suggest
using `/restate/` and an appropriate prefix to avoid confusion:

```shell
export AUTH_TOKEN_ARN=$(aws secretsmanager create-secret \
    --name /restate/${CLUSTER_ID}/auth-token --secret-string ${RESTATE_AUTH_TOKEN} \
    --query ARN --output text
)
```

Once you have the ARN for the auth token secret, you can deploy the stack using:

```shell
npx cdk deploy \
    --context clusterId=${CLUSTER_ID} \
    --context authTokenSecretArn=${AUTH_TOKEN_ARN}
```

Alternatively, you can save this information in the `cdk.context.json` file:

```json
{
  "clusterId": "cluster-id",
  "authTokenSecretArn": "arn:aws:secretsmanager:us-east-1:123456789012:secret:/restate/cluster-id/auth-token-abc123"
}
```

In that case, you can simply run:

```shell
npm run deploy
```

In this example, the Lambda handler function name is dynamically generated by CDK. You can see what it is from the `HandlerFunction`
output of the CDK stack after a successful deployment.

### Test

You can send a test request to the Restate cluster ingress endpoint to call the newly deployed service:

```shell
curl -H "Authorization: Bearer ${RESTATE_API_TOKEN}" \
    -H 'content-type: application/json' -d '{"key":"Restate Customer"}' \
    https://${CLUSTER_ID}.dev.restate.cloud:8080/Greeter/greet
```

### Useful commands

* `npm run build`   compile the Lambda handler and synthesize CDK deployment artifacts
* `npm run deploy`  perform a CDK deployment