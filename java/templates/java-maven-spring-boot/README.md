# Hello world - Spring Boot example

Sample project configuration of a Restate service using the Java SDK and Spring Boot. 

Have a look at the [Java Quickstart guide](https://docs.restate.dev/get_started/quickstart?sdk=java) for more information on how to use this project.

## Starting the service

To start the service, simply run:

```shell
$ mvn compile spring-boot:run
```

Restate SDK uses annotation processing to generate client classes.
When modifying the annotated services in Intellij, it is suggested to run **CTRL + F9** to re-generate the client classes.