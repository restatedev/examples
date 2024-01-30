# Hello world - Java HTTP example

Sample project configuration of a Restate service using the Java interface and HTTP server. It contains:

* [`build.gradle.kts`](build.gradle.kts)
* [Service interface definition `greeter.proto`](src/main/proto/greeter.proto)
* [Service class implementation `Greeter`](src/main/java/dev/restate/sdk/examples/Greeter.java)
* [Test `GreeterTest`](src/test/java/dev/restate/sdk/examples/GreeterTest.java)
* [Logging configuration](src/main/resources/log4j2.properties)

## Download the example

- Via the CLI:
    ```shell
    restate example java-hello-world-http && cd java-hello-world-http
    ```

- Via git clone:
    ```shell
    git clone git@github.com:restatedev/examples.git
    cd examples/java/hello-world-http
    ```

- Via `wget`:
    ```shell
    wget https://github.com/restatedev/examples/releases/latest/download/java-hello-world-http.zip && unzip java-hello-world-http.zip -d java-hello-world-http && rm java-hello-world-http.zip
    ```

## Running the example

You can run the Java greeter service via:

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