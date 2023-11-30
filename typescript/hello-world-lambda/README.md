# Deploying a Restate Typescript greeter on AWS Lambda

Restate is a system for easily building resilient applications using **distributed durable RPC & async/await**.

This example contains the greeter service which you can deploy on AWS Lambda.
Take a look at [how to deploy Restate services on AWS Lambda](https://docs.restate.dev/services/deployment/lambda#tutorial) for more information.

## Download the example

```shell
EXAMPLE=typescript-hello-world-lambda; wget https://github.com/restatedev/examples/releases/latest/download/$EXAMPLE.zip && unzip $EXAMPLE.zip -d $EXAMPLE && rm $EXAMPLE.zip
```
