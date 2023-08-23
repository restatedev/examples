# Restate examples

Browse this repository to see how easy distributed applications development becomes with Restate.

## Typescript examples

### Starter examples

* [Lambda greeter](typescript/lambda-greeter): A simple example of how you can run a Restate service on AWS Lambda.
* [Payment api](typescript/payment-api/): Example API for payments, inspired by the Stripe API.

### Intermediate examples

* [Ticket reservation](typescript/ticket-reservation): An example to illustrate how Restate's keyed-sharding and concurrency guarantees simplify microservice architectures.
* [Food ordering](typescript/food-ordering): An example application which uses Awakeables to integrate with external services using the grpc-based Typescript SDK.

### Advanced examples

- [Ecommerce store](typescript/ecommerce-store): A sophisticated example on how to build an ecommerce store based on Restate using the grpc-based Typescript SDK.

## Running the examples

In order to run the examples you first need to [sign up for Restate's private beta](https://forms.gle/G8kDuucqhBoTfMwLA).
After signing-up, you have to set up your [access to Restate's packages](https://github.com/restatedev/restate-dist) which gives you access to the runtime as well as the SDK artifacts.

### Launching the runtime

Have a look at how to start up the runtime in a Docker container in [this repository]* or run the following commands:

- For MacOS:
```shell
docker run --name restate_dev --rm -p 8081:8081 -p 9091:9091 -p 9090:9090 ghcr.io/restatedev/restate-dist:latest
```
- For Linux:
```shell
docker run --name restate_dev --rm --network=host ghcr.io/restatedev/restate-dist:latest
```

### Connect runtime and services

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

In order to upgrade/update the SDK dependency you have to run:

**Major version** change:

```shell
npm --prefix typescript install @restatedev/restate-sdk@^Z.Y.X --workspaces
```

**Minor/patch version** change:

```shell
npm --prefix typescript update @restatedev/restate-sdk --workspaces
```

Now check whether the examples are still building:

```shell
npm --prefix typescript run verify --workspaces
```
