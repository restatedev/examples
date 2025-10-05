# Hello world - Quarkus example

Sample project configuration of a Restate service using the Java SDK and Quarkus. 

Have a look at the [Java Quickstart guide](https://docs.restate.dev/get_started/quickstart?sdk=java) for more information on how to use this project.

## Starting the service

Check out https://quarkus.io/get-started/ to install quarkus.

To start the service, simply run:

```shell
$ quarkus dev
```

## Unit testing

The restate `RestateExtension` junit extension does currently not work together with quarkus CDI, so you cannot combine 
`@RestateTest` with `@QuarkusTest`, so if you want to use `@Inject` in unit test with restate services, you must use 
the `RestateRunner` directly as shown in the `GreeterCdiTest`.