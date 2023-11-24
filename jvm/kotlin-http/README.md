# Kotlin HTTP example

Sample project configuration of a Restate service using the Kotlin coroutines interface and HTTP server. It contains:

* [`build.gradle.kts`](build.gradle.kts)
* [Service interface definition `greeter.proto`](src/main/proto/greeter.proto)
* [Service class implementation `Greeter`](src/main/kotlin/dev/restate/sdk/examples/Greeter.kt)
* [Test `GreeterTest`](src/test/kotlin/dev/restate/sdk/examples/GreeterTest.kt)
* [Logging configuration](src/main/resources/log4j2.properties)

## Running the example

You can run the Kotlin greeter service via:

```shell
./gradlew run
```

Or from the IDE UI.

## Running the tests

You can run the tests either via:

```shell
./gradlew check
```

Or from the IDE UI.
