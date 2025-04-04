# Hello world - Kotlin Lambda (CDK) example

Sample project deploying a Kotlin-based Restate service to AWS Lambda using the AWS Cloud Development Kit (CDK).
The stack uses the Restate CDK constructs library to create an EC2-hosted Restate server in AWS, and to register the
service with this Restate environment.

For more information on CDK, please see [Getting started with the AWS CDK](https://docs.aws.amazon.com/cdk/v2/guide/getting_started.html).

* [CDK app entry point `lambda-jvm-cdk.ts`](bin/lambda-jvm-cdk.ts)
* [CDK stack consisting of a Lambda function and providing Restate service registration](cdk/lambda-jvm-cdk-stack.ts)
* [Kotlin Lambda handler](lambda) - based on [`hello-world-lambda`](lambda/src/main/kotlin/dev/restate/sdk/examples/LambdaHandler.kt)

## Download the example

- Via the CLI:
    ```shell
    restate example kotlin-hello-world-lambda-cdk && cd kotlin-hello-world-lambda-cdk
    ```

- Via git clone:
    ```shell
    git clone git@github.com:restatedev/examples.git
    cd examples/kotlin/integrations/kotlin-gradle-lambda-cdk
    ```

- Via `wget`:
    ```shell
    wget https://github.com/restatedev/examples/releases/latest/download/kotlin-hello-world-lambda-cdk.zip && unzip kotlin-hello-world-lambda-cdk.zip -d kotlin-hello-world-lambda-cdk && rm kotlin-hello-world-lambda-cdk.zip
    ```

## Deploy

**Pre-requisites:**

* npm
* gradle
* JDK >= 21
* AWS account, bootstrapped for CDK use
* valid AWS credentials with sufficient privileges to create the necessary resources
* an existing [Restate Cloud](https://restate.dev) environment (environment id + API key)

Install npm dependencies:

```shell
npm install
```

To deploy the stack, export the Restate Cloud environment id and API key, and run `cdk deploy`:

```shell
export RESTATE_ENV_ID=env_... RESTATE_API_KEY=key_...
npx cdk deploy
```

The stack output will print out the Restate server ingress URL.

### Test

You can send a test request to the Restate ingress endpoint to call the newly deployed service:

```shell
curl -k ${restateIngressUrl}/Greeter/greet \
  -H "Authorization: Bearer $RESTATE_API_KEY" \
  -H 'content-type: application/json' -d '"Restate"'
```

### Useful commands

* `npm run build`    compile the Lambda handler and synthesize CDK deployment artifacts
* `npm run deploy`   perform a CDK deployment
* `npm run destroy`  delete the stack and all its resources
