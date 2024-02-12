# Hello world - Java Workflow example

Sample project configuration of a Restate worfklow using the Java interface and HTTP server. It contains:

* [`build.gradle.kts`](build.gradle.kts)
* [Workflow implementation `LoanApproval`](src/main/java/my/restate/examples/LoanApproval.java)
* [Test `LoanApprovalTest`](src/test/java/my/restate/examples/LoanApprovalTest.java)
* [Logging configuration](src/main/resources/log4j2.properties)

## Download the example

- Via the CLI:
    ```shell
    restate example java-hello-world-workflow && cd java-hello-world-workflow
    ```

- Via git clone:
    ```shell
    git clone git@github.com:restatedev/examples.git
    cd examples/java/hello-world-workflow
    ```

- Via `wget`:
    ```shell
    wget https://github.com/restatedev/examples/releases/latest/download/java-hello-world-workflow.zip && unzip java-hello-world-workflow.zip -d java-hello-world-workflow && rm java-hello-world-workflow.zip
    ```

## Running the example

You can run the example via:

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