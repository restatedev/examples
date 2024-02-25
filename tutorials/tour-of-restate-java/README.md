# A Tour of Restate with Java

Restate is a system for easily building resilient applications using **distributed durable RPC & async/await**.

This example contains the code for the `Tour of Restate` tutorial, for the Java SDK.
This tutorial takes your through key Restate features by developing an end-to-end ticketing app.

❓ Learn more about Restate from the [Restate documentation](https://docs.restate.dev).


## Download the example

- Via the CLI:
    ```shell
    restate example java-tour-of-restate && cd java-tour-of-restate
    ```

- Via git clone:
    ```shell
    git clone git@github.com:restatedev/examples.git
    cd examples/tutorials/tour-of-restate-java
    ```

- Via `wget`:
    ```shell
   wget https://github.com/restatedev/examples/releases/latest/download/java-tour-of-restate.zip && unzip java-tour-of-restate.zip -d java-tour-of-restate && rm java-tour-of-restate.zip
    ```

## Running the example

Have a look at the [Tour of Restate tutorial](https://docs.restate.dev/tour) in the documentation to build and run the application in this repository.

In short, you can run the different parts of the code via: 

```typescript
./gradlew run
./gradlew -PmainClass=dev.restate.tour.part1.AppMain run
./gradlew -PmainClass=dev.restate.tour.part2.AppMain run
./gradlew -PmainClass=dev.restate.tour.part3.AppMain run
./gradlew -PmainClass=dev.restate.tour.part4.AppMain run
```
