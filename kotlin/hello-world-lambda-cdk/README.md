# Hello world - Kotlin Lambda (CDK) example

Sample project deploying a Kotlin-based Restate service to AWS Lambda using CDK. This is functionally equivalent
to the [`hello-world-lambda`](../hello-world-lambda) example but uses CDK to automate the deploy of the Lambda function
to AWS, and the registration of the handler with Restate Cloud.

## Deploy

Pre-requisites:

* npm
* gradle
* JDK
* Restate Cloud access
* AWS account

Run:

```shell
npm run deploy
```

### Useful commands

* `npm run build`   compile the Lambda handler and synthesize CDK deployment artifacts
* `npm run deploy`  perform a CDK deployment
