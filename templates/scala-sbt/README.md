# Hello world HTTP in Scala

Sample project configuration of a Restate service using Scala and HTTP server. It contains:

* [`build.sbt`](build.sbt)
* [Service interface definition `greeter.proto`](src/main/protobuf/greeter.proto)
* [Service class implementation `dev.restate.sdk.examples.Greeter`](src/main/scala/dev/restate/sdk/examples/Greeter.scala)
* [Logging configuration](src/main/resources/log4j2.properties)

## Download the example

- Via git clone:
    ```shell
    git clone git@github.com:restatedev/examples.git
    cd examples/scala/hello-world-http
    ```

## Running the example

You can run the Java greeter service via:

```shell
sbt clean compile run
```

Or from your IDE.