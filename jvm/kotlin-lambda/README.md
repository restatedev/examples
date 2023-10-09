# Kotlin Lambda example

Example with Kotlin coroutines interface and Lambda.

## Setup credentials

Because the SDK is not public yet, you need to set up the PAT credentials, see https://github.com/restatedev/e2e#setup-local-env

## Package

Run:

```shell
./gradlew shadowJar
```

You'll find the shadowed jar in the `build` directory.

The class to configure in Lambda is `dev.restate.sdk.lambda.LambdaHandler`.