# Hello world - Java Lambda example

Sample project configuration of a Restate service using the Java interface and AWS Lambda. It contains:

* [`build.gradle.kts`](build.gradle.kts)
* [Service interface definition `greeter.proto`](src/main/proto/greeter.proto)
* [Service class implementation `Greeter`](src/main/java/dev/restate/sdk/examples/Greeter.java)
* [Lambda handler `LambdaHandler`](src/main/java/dev/restate/sdk/examples/LambdaHandler.java)
* [Test `GreeterTest`](src/test/java/dev/restate/sdk/examples/GreeterTest.java)
* [Logging configuration](src/main/resources/log4j2.properties)

## Download the example

```shell
wget https://github.com/restatedev/examples/releases/latest/download/java-hello-world-lambda.zip && unzip java-hello-world-lambda.zip -d java-hello-world-lambda && rm java-hello-world-lambda.zip
```

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

Or from your IDE.