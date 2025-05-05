# Hello world - Python Lambda (CDK) example

Sample project deploying a Python-based Restate service to AWS Lambda using the AWS Cloud Development Kit (CDK).
The stack uses the Restate CDK constructs library to register service with a Restate Cloud environment.

For more information on CDK, please see [Getting started with the AWS CDK](https://docs.aws.amazon.com/cdk/v2/guide/getting_started.html).

* [CDK app entry point `lambda-python-app.ts`](bin/lambda-python-app.ts)
* [CDK stack consisting of a Lambda function and providing Restate service registration](lib/lambda-python-stack.ts)
* [Python Lambda handler](lib/lambda/handler.py)

## Download the example

- Via the CLI:
    ```shell
    restate example python-hello-world-lambda-cdk && cd python-hello-world-lambda-cdk
    ```

- Via git clone:
    ```shell
    git clone git@github.com:restatedev/examples.git
    cd examples/python/integrations/deployment-lambda-cdk
    ```

- Via `wget`:
    ```shell
    wget https://github.com/restatedev/examples/releases/latest/download/python-hello-world-lambda-cdk.zip && unzip python-hello-world-lambda-cdk.zip -d python-hello-world-lambda-cdk && rm python-hello-world-lambda-cdk.zip
    ```

## Deploy

**Pre-requisites:**

* npm
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

You can send a test request to the Restate ingress endpoint to call the newly deployed service:

### Test

You can send a test request to the Restate cluster ingress endpoint to call the newly deployed service:

```shell
curl -k ${restateIngressUrl}/Greeter/greet \
  -H "Authorization: Bearer $RESTATE_API_KEY" \
  -H 'content-type: application/json' -d '"Restate"'
```

Note the single-quotes around the input to prevent the shell from interpreting the inner quotes - the request must be a
valid JSON string value.

### Useful commands

* `npm run build`    bundle the Lambda handler and synthesize CDK deployment artifacts
* `npm run deploy`   perform a CDK deployment
* `npm run destroy`  delete the stack and all its resources
