# Hello world - TypeScript Lambda example

Restate is a system for easily building resilient applications using **distributed durable RPC & async/await**.

This example contains the greeter service which you can deploy on AWS Lambda. Take a look
at [how to deploy Restate services on AWS Lambda](https://docs.restate.dev/services/deployment/lambda/lambda-typescript)
for a walk through guide to deploying this service.

## Download the example

- Via the CLI:
    ```shell
    restate example typescript-hello-world-lambda && cd typescript-hello-world-lambda
    ```

- Via git clone:
    ```shell
    git clone git@github.com:restatedev/examples.git
    cd examples/typescript/hello-world-lambda
    ```

- Via `wget`:
    ```shell
    wget https://github.com/restatedev/examples/releases/latest/download/typescript-hello-world-lambda.zip && unzip typescript-hello-world-lambda.zip -d typescript-hello-world-lambda && rm typescript-hello-world-lambda.zip
    ```
