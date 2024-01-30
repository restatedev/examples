# Hello world - Kotlin HTTP example

Sample project configuration of a Restate service using the Kotlin coroutines interface and HTTP server. It contains:

* [`build.gradle.kts`](build.gradle.kts)
* [Service interface definition `greeter.proto`](src/main/proto/greeter.proto)
* [Service class implementation `Greeter`](src/main/kotlin/dev/restate/sdk/examples/Greeter.kt)
* [Test `GreeterTest`](src/test/kotlin/dev/restate/sdk/examples/GreeterTest.kt)
* [Logging configuration](src/main/resources/log4j2.properties)

## Download the example

- Via the CLI:
    ```shell
    restate example kotlin-hello-world-http && cd kotlin-hello-world-http
    ```

- Via git clone:
    ```shell
    git clone git@github.com:restatedev/examples.git
    cd examples/kotlin/hello-world-http
    ```

- Via `wget`:
    ```shell
    wget https://github.com/restatedev/examples/releases/latest/download/kotlin-hello-world-http.zip && unzip kotlin-hello-world-http.zip -d kotlin-hello-world-http && rm kotlin-hello-world-http.zip
    ```

## Running the example

You can run the Kotlin greeter service via:

```shell
./gradlew run
```

Or from your IDE.

## Running the tests

You can run the tests either via:

```shell
./gradlew check
```

Or from your IDE.
