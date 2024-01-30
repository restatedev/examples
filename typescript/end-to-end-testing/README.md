# Typescript End to End service test example

Restate is a system for easily building resilient applications using **distributed durable RPC & async/await**.

This example shows how to test Restate services by deploying Restate with [TestContainers](https://node.testcontainers.org/). It is loosely based on the [Typescript gRPC template](https://github.com/restatedev/node-template-generator#grpc-variant).

## Download the example

```shell
wget https://github.com/restatedev/examples/releases/latest/download/typescript-end-to-end-testing.zip && unzip typescript-end-to-end-testing.zip -d typescript-end-to-end-testing && rm typescript-end-to-end-testing.zip
```

## Run

Install the dependencies and run the `buf` code generation first:

```shell
npm install & npm run proto
```

Now you can run the tests:

```shell
npm run test
```

If you are encountering errors, try to pull the latest docker image: `docker pull docker.io/restatedev/restate:latest`.