# A Tour of Restate with Java

Restate is a system for easily building resilient applications, workflows, asynchronous tasks,
and event-driven applications.

This example contains the code for the `Tour of Restate` tutorial, for the Java SDK.
This tutorial takes your through key Restate features by developing an end-to-end ticketing app.

❓ Learn more about Restate from the [Restate documentation](https://docs.restate.dev).


## Download the Tutorial

You can clone the example repository (`git clone https://github.com/restatedev/examples`) or just download this tutorial via

- **CLI:** `restate example java-tour-of-restate`

- **Zip archive:** `wget https://github.com/restatedev/examples/releases/latest/download/java-tour-of-restate.zip`


## Running the example

Have a look at the [Tour of Restate tutorial](https://docs.restate.dev/get_started/tour) in the documentation to build and run the application in this repository.

In short, you can run the different parts of the code via: 

```typescript
./gradlew run
./gradlew -PmainClass=dev.restate.tour.part1.AppMain run
./gradlew -PmainClass=dev.restate.tour.part2.AppMain run
./gradlew -PmainClass=dev.restate.tour.part3.AppMain run
./gradlew -PmainClass=dev.restate.tour.part4.AppMain run
```
