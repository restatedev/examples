# Go Lambda (CDK) example


Sample project deploying a Go-based Restate service to AWS Lambda using the AWS Cloud Development Kit (CDK).
The stack uses the Restate CDK constructs library to register the service with a Restate Cloud environment.

For more information on CDK, please see [Getting started with the AWS CDK](https://docs.aws.amazon.com/cdk/v2/guide/getting_started.html).

* [CDK app entry point `lambda-go-cdk.ts`](bin/lambda-go-cdk.ts)
* [CDK stack consisting of a Lambda function and providing Restate service registration](cdk/lambda-go-cdk-stack.ts)
* [Go Lambda handler](lambda) - based on [`go` template](../go)

## Download the example

- Via the CLI:
    ```shell
    restate example go-lambda-cdk && cd go-lambda-cdk
    ```

- Via git clone:
    ```shell
    git clone git@github.com:restatedev/examples.git
    cd examples/templates/go-lambda-cdk
    ```

- Via `wget`:
    ```shell
    wget https://github.com/restatedev/examples/releases/latest/download/go-lambda-cdk.zip && unzip go-lambda-cdk.zip -d go-lambda-cdk && rm go-lambda-cdk.zip
    ```

## Deploy

**Pre-requisites:**

* npm
* Go >= 1.21
* AWS account, bootstrapped for CDK use
* valid AWS credentials with sufficient privileges to create the necessary resources
* an existing [Restate Cloud](https://restate.dev) environment (environment id + API key)

Install npm dependencies:

```shell
npm install
```

To deploy the stack, export the Restate Cloud environment id and admin API key, and run `cdk deploy`:

```shell
export RESTATE_ENV_ID=env_... RESTATE_API_KEY=key_...
npx cdk deploy
```

The stack output will print out the Restate server ingress URL.

### Test

You can send a test request to the Restate ingress endpoint to call the newly deployed service:

```shell
curl -k ${restateIngressUrl}/Greeter/Greet \
  -H "Authorization: Bearer $RESTATE_API_KEY" \
  -H 'content-type: application/json' -d '"Restate"'
```

### Useful commands

* `npm run build`    compile the Lambda handler and synthesize CDK deployment artifacts
* `npm run deploy`   perform a CDK deployment
* `npm run destroy`  delete the stack and all its resources
