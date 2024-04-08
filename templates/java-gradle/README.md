# Hello world - Java HTTP example

Sample project configuration of a Restate service using the Java interface and HTTP server. It contains:

* [`build.gradle.kts`](build.gradle.kts)
* [Virtual object `Greeter`](src/main/java/my/example/Greeter.java)
* [Logging configuration](src/main/resources/log4j2.properties)

## Download the example

- Via the CLI:
    ```shell
    restate example java-hello-world-gradle && cd java-hello-world-gradle
    ```

- Via git clone:
    ```shell
    git clone git@github.com:restatedev/examples.git
    cd examples/templates/java-gradle
    ```

- Via `wget`:
    ```shell
    wget https://github.com/restatedev/examples/releases/latest/download/java-hello-world-gradle.zip && unzip java-hello-world-gradle.zip -d java-hello-world-gradle && rm java-hello-world-gradle.zip
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