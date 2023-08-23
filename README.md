# Restate examples

Browse this repository to see how easy distributed applications development becomes with Restate.

## Typescript examples

### Simple examples

* [Lambda greeter](typescript/lambda-greeter): A simple example of how you can run a Restate service on AWS Lambda.
* [Payment api](typescript/payment-api/): Example API for payments, inspired by the Stripe API.

### Intermediate examples

* [Ticket reservation](typescript/ticket-reservation): An example to illustrate how Restate's keyed-sharding and concurrency guarantees simplify microservice architectures.
* [Food ordering](typescript/food-ordering): An example application which uses Awakeables to integrate with external services using the grpc-based Typescript SDK.

### Complex examples

- [Ecommerce store](typescript/ecommerce-store): A sophisticated example on how to build an ecommerce store based on Restate using the grpc-based Typescript SDK.

## Launching the runtime

Have a look at how to start up the runtime in a Docker container in this repository: https://github.com/restatedev/restate-dist or simply run the following commands:

- For MacOS:
```shell
docker run --name restate_dev --rm -p 8081:8081 -p 9091:9091 -p 9090:9090 ghcr.io/restatedev/restate-dist:0.2.0
```
- For Linux:
```shell
docker run --name restate_dev --rm --network=host ghcr.io/restatedev/restate-dist:0.2.0
```

## Connect runtime and services

Once the runtime is up, let it discover the services of the examples by executing:

- For MacOS:
```shell
curl -X POST http://localhost:8081/endpoints -H 'content-type: application/json' -d '{"uri": "http://host.docker.internal:8080"}'
```
- For Linux:
```shell
curl -X POST http://localhost:8081/endpoints -H 'content-type: application/json' -d '{"uri": "http://localhost:8080"}'
```

This should give you the following output in case of the ticket reservation example:
```json
{
    "id": "bG9jYWxob3N0OjgwODAv",
    "services": [
        {
            "name": "UserSession",
            "revision": 1
        },
        {
            "name": "TicketDb",
            "revision": 1
        },
        {
            "name": "CheckoutProcess",
            "revision": 1
        }
    ]
}
```

## Releasing (for Restate developers)

In order to create a new release, push a tag of the form `vX.Y.Z`.
Then [create a release via GitHub](https://github.com/restatedev/example-lambda-ts-greeter/releases).

### Upgrading the SDK dependency (for Restate developers)

In order to upgrade the SDK depedency you have to run:

```shell
npm install --prefix typescript @restatedev/restate-sdk@Z.Y.X --workspaces --save-exact
```

Now check whether the examples are still building:

```shell
npm run --prefix typescript verify --workspaces
```

### Upgrading the runtime version

Update the runtime version tag in this [README.md](README.md#launching-the-runtime).
