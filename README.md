[![Documentation](https://img.shields.io/badge/doc-reference-blue)](https://docs.restate.dev)
[![Discord](https://img.shields.io/badge/join-discord-purple)](https://discord.gg/skW3AZ6uGd)
[![Twitter](https://img.shields.io/twitter/follow/restatedev.svg?style=social&label=Follow)](https://twitter.com/intent/follow?screen_name=restatedev)

# Restate examples

Browse this repository to see how easy distributed applications development becomes with Restate.

## Starters

![TypeScript](https://img.shields.io/badge/typescript-%23007ACC.svg?style=for-the-badge&logo=typescript&logoColor=white)

[Hello world on AWS Lambda](typescript/hello-world-lambda)
```shell
# Download the example
EXAMPLE=typescript-hello-world-lambda; wget https://github.com/restatedev/examples/releases/latest/download/$EXAMPLE.zip && unzip $EXAMPLE.zip -d $EXAMPLE && rm $EXAMPLE.zip
```

![Java](https://img.shields.io/badge/java-%23ED8B00.svg?style=for-the-badge&logo=openjdk&logoColor=white)

[Hello World HTTP](jvm/hello-world-java-http)
```shell
# Download the example
EXAMPLE=jvm-hello-world-java-http; wget https://github.com/restatedev/examples/releases/latest/download/$EXAMPLE.zip && unzip $EXAMPLE.zip -d $EXAMPLE && rm $EXAMPLE.zip
```

[Hello world on AWS Lambda](jvm/hello-world-java-lambda)
```shell
# Download the example
EXAMPLE=jvm-hello-world-java-lambda; wget https://github.com/restatedev/examples/releases/latest/download/$EXAMPLE.zip && unzip $EXAMPLE.zip -d $EXAMPLE && rm $EXAMPLE.zip
```

![Kotlin](https://img.shields.io/badge/kotlin-%237F52FF.svg?style=for-the-badge&logo=kotlin&logoColor=white)

[Hello World HTTP](jvm/hello-world-kotlin-http)
```shell
# Download the example
EXAMPLE=jvm-hello-world-kotlin-http; wget https://github.com/restatedev/examples/releases/latest/download/$EXAMPLE.zip && unzip $EXAMPLE.zip -d $EXAMPLE && rm $EXAMPLE.zip
```

[Hello world on AWS Lambda](jvm/hello-world-kotlin-lambda)
```shell
# Download the example
EXAMPLE=jvm-hello-world-kotlin-lambda; wget https://github.com/restatedev/examples/releases/latest/download/$EXAMPLE.zip && unzip $EXAMPLE.zip -d $EXAMPLE && rm $EXAMPLE.zip
```

## Patterns

![TypeScript](https://img.shields.io/badge/typescript-%23007ACC.svg?style=for-the-badge&logo=typescript&logoColor=white)

[Payment api](typescript/payment-api): Example API for payments, inspired by the Stripe API
```shell
# Download the example
EXAMPLE=typescript-payment-api; wget https://github.com/restatedev/examples/releases/latest/download/$EXAMPLE.zip && unzip $EXAMPLE.zip -d $EXAMPLE && rm $EXAMPLE.zip
```

## Applications

![TypeScript](https://img.shields.io/badge/typescript-%23007ACC.svg?style=for-the-badge&logo=typescript&logoColor=white)

[Food ordering](typescript/food-ordering): Integrate Restate with external services
```shell
# Download the example
EXAMPLE=typescript-food-ordering; wget https://github.com/restatedev/examples/releases/latest/download/$EXAMPLE.zip && unzip $EXAMPLE.zip -d $EXAMPLE && rm $EXAMPLE.zip
```

[Ticket reservation](typescript/ticket-reservation): Example showing Restate's keyed-sharding and concurrency guarantees
```shell
# Download the example
EXAMPLE=typescript-ticket-reservation; wget https://github.com/restatedev/examples/releases/latest/download/$EXAMPLE.zip && unzip $EXAMPLE.zip -d $EXAMPLE && rm $EXAMPLE.zip
```

[Ecommerce store](typescript/ecommerce-store): An ecommerce store completely built on top of Restate
```shell
# Download the example
EXAMPLE=typescript-ecommerce-store; wget https://github.com/restatedev/examples/releases/latest/download/$EXAMPLE.zip && unzip $EXAMPLE.zip -d $EXAMPLE && rm $EXAMPLE.zip
```

## Joining the community

If you want to join the Restate community in order to stay up to date, then please join our [Discord](https://discord.gg/skW3AZ6uGd).
The Discord server is also the perfect place for sharing your feedback with us, learning more about Restate and connect with others!

## Running the examples

The readme for each example will explain how to get it running. Once the example is running, it needs to be discovered by an instance of the Restate runtime.

### Launching the runtime

Have a look at how to start up the runtime in a Docker container in [this repository]* or run the following commands:

- For MacOS:
```shell
docker run --name restate_dev --rm -p 8080:8080 -p 9070:9070 -p 9071:9071 docker.io/restatedev/restate:latest
```
- For Linux:
```shell
docker run --name restate_dev --rm --network=host docker.io/restatedev/restate:latest
```

### Connect runtime and services

Once the runtime is up, let it discover the services of the example by executing:

- For MacOS:
```shell
curl -X POST http://localhost:9070/endpoints -H 'content-type: application/json' -d '{"uri": "http://host.docker.internal:9080"}'
```
- For Linux:
```shell
curl -X POST http://localhost:9070/endpoints -H 'content-type: application/json' -d '{"uri": "http://localhost:9080"}'
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

Before releasing, trigger the "pre-release" workflow to update sdk versions. This automatically creates a pull request, which must be manually merged.

Once the repo is ready for the release, push a tag of the form `vX.Y.Z`.

This triggers a workflow that [creates a draft release](https://github.com/restatedev/examples/releases) on Github, which you need to approve to finalize it.
