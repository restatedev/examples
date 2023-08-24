# Restate examples

Browse this repository to see how easy distributed applications development becomes with Restate.

## Typescript examples

### Starter examples

* [Lambda greeter](typescript/lambda-greeter): A simple example of how you can run a Restate service on AWS Lambda.
* [Payment api](typescript/payment-api/): Example API for payments, inspired by the Stripe API.
* [Food ordering](typescript/food-ordering): See how to integrate Restate with external services using Awakeables and side effects.

### Intermediate examples

* [Ticket reservation](typescript/ticket-reservation): An example to illustrate how Restate's keyed-sharding and concurrency guarantees simplify microservice architectures.

### Advanced examples

- [Ecommerce store](typescript/ecommerce-store): A sophisticated example on how to build an ecommerce store based on Restate using the grpc-based Typescript SDK.

## Joining the community

If you want to join the Restate community in order to stay up to date, then please join our [Discord](https://discord.gg/skW3AZ6uGd).
The Discord server is also the perfect place for sharing your feedback with us, learning more about Restate and connect with others!

## Running the examples

> **Note**
> Make sure you have [signed up for Restate's private beta](https://forms.gle/G8kDuucqhBoTfMwLA) and set up [access to Restate's packages](https://github.com/restatedev/restate-dist).

### Launching the runtime

Have a look at how to start up the runtime in a Docker container in [this repository]* or run the following commands:

- For MacOS:
```shell
docker run --name restate_dev --rm -p 8081:8081 -p 9091:9091 -p 9090:9090 -p 5432:5432 ghcr.io/restatedev/restate-dist:latest
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
