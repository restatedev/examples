# Blocking Lambda example

Sample project configuration of a Restate service using the Java blocking interface and AWS Lambda. It contains:

* [`build.gradle.kts`](build.gradle.kts)
* [Service interface definition `greeter.proto`](src/main/proto/greeter.proto)
* [Service class implementation `Greeter`](src/main/java/dev/restate/sdk/examples/Greeter.java)
* [Lambda handler `LambdaHandler`](src/main/java/dev/restate/sdk/examples/LambdaHandler.java)
* [Test `GreeterTest`](src/test/java/dev/restate/sdk/examples/GreeterTest.java)
* [Logging configuration](src/main/resources/log4j2.properties)

## Package

Run:

```shell
./gradlew shadowJar
```

You'll find the shadowed jar in the `build` directory.

The class to configure in Lambda is `dev.restate.sdk.examples.LambdaHandler`.

## Running the tests

You can run the tests either via:

```shell
./gradlew check
```

Or from the IDE UI.