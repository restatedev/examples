# Hello world - Kotlin Lambda (CDK) example

Sample project deploying a Kotlin-based Restate service to AWS Lambda using CDK. This is functionally equivalent
to the [`hello-world-lambda`](../hello-world-lambda) example but uses CDK to automate the deploy of the Lambda function
to AWS, and the registration of the handler with Restate Cloud.

**Pre-requisites:**

* npm
* gradle
* JDK
* Restate Cloud access
* AWS account

## Deploy

You should have two pieces of information about your Restate Cloud: a cluster identifier and an API authentication token.

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
  "clusterId": "...",
  "authTokenSecretArn": "arn:aws:secretsmanager:us-east-1:123456789012:secret:/restate/.../auth-token-abc123"
}
```

In that case, you can simply run:

```shell
npm run deploy
```

### Test

You can send a test request to the Restate cluster ingress endpoint to call the newly deployed service:

```shell
curl --json '{}' -H "Authorization: Bearer ${RESTATE_API_TOKEN}" \
    https://${CLUSTER_ID}.dev.restate.cloud:8080/greeter.Greeter/Greet
```

### Useful commands

* `npm run build`   compile the Lambda handler and synthesize CDK deployment artifacts
* `npm run deploy`  perform a CDK deployment
