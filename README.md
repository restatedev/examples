[![Documentation](https://img.shields.io/badge/doc-reference-blue)](https://docs.restate.dev)
[![Discord](https://img.shields.io/discord/1128210118216007792?logo=discord)](https://discord.gg/skW3AZ6uGd)
[![Twitter](https://img.shields.io/twitter/follow/restatedev.svg?style=social&label=Follow)](https://twitter.com/intent/follow?screen_name=restatedev)

# Restate examples

Browse this repository to see how easy distributed applications development becomes with Restate.

## Starters

![TypeScript](https://img.shields.io/badge/typescript-%23007ACC.svg?style=for-the-badge&logo=typescript&logoColor=white)

[Hello world on AWS Lambda](typescript/hello-world-lambda)
```shell
# Download the example
wget https://github.com/restatedev/examples/releases/latest/download/typescript-hello-world-lambda.zip && unzip typescript-hello-world-lambda.zip -d typescript-hello-world-lambda && rm typescript-hello-world-lambda.zip
```

![TypeScript](https://img.shields.io/badge/typescript-%23007ACC.svg?style=for-the-badge&logo=typescript&logoColor=white)

[Hello world on AWS Lambda + CDK](typescript/hello-world-lambda-cdk)
```shell
# Download the example
wget https://github.com/restatedev/examples/releases/latest/download/typescript-hello-world-lambda-cdk.zip && unzip typescript-hello-world-lambda-cdk.zip -d typescript-hello-world-lambda-cdk && rm typescript-hello-world-lambda-cdk.zip
```

![Java](https://img.shields.io/badge/java-%23ED8B00.svg?style=for-the-badge&logo=openjdk&logoColor=white)

[Hello World HTTP](java/hello-world-http)
```shell
# Download the example
wget https://github.com/restatedev/examples/releases/latest/download/java-hello-world-http.zip && unzip java-hello-world-http.zip -d java-hello-world-http && rm java-hello-world-http.zip
```

[Hello world on AWS Lambda](java/hello-world-lambda)
```shell
# Download the example
wget https://github.com/restatedev/examples/releases/latest/download/java-hello-world-lambda.zip && unzip java-hello-world-lambda.zip -d java-hello-world-lambda && rm java-hello-world-lambda.zip
```

![Kotlin](https://img.shields.io/badge/kotlin-%237F52FF.svg?style=for-the-badge&logo=kotlin&logoColor=white)

[Hello World HTTP](kotlin/hello-world-http)
```shell
# Download the example
wget https://github.com/restatedev/examples/releases/latest/download/kotlin-hello-world-http.zip && unzip kotlin-hello-world-http.zip -d kotlin-hello-world-http && rm kotlin-hello-world-http.zip
```

[Hello world on AWS Lambda](kotlin/hello-world-lambda)
```shell
# Download the example
wget https://github.com/restatedev/examples/releases/latest/download/kotlin-hello-world-lambda.zip && unzip kotlin-hello-world-lambda.zip -d kotlin-hello-world-lambda && rm kotlin-hello-world-lambda.zip
```

[Hello world on AWS Lambda + CDK](kotlin/hello-world-lambda-cdk)
```shell
# Download the example
wget https://github.com/restatedev/examples/releases/latest/download/kotlin-hello-world-lambda-cdk.zip && unzip kotlin-hello-world-lambda-cdk.zip -d kotlin-hello-world-lambda-cdk && rm kotlin-hello-world-lambda-cdk.zip
```

## Patterns

![TypeScript](https://img.shields.io/badge/typescript-%23007ACC.svg?style=for-the-badge&logo=typescript&logoColor=white)

[Payment api](typescript/payment-api): Example API for payments, inspired by the Stripe API
```shell
# Download the example
wget https://github.com/restatedev/examples/releases/latest/download/typescript-payment-api.zip && unzip typescript-payment-api.zip -d typescript-payment-api && rm typescript-payment-api.zip
```

## Applications

![TypeScript](https://img.shields.io/badge/typescript-%23007ACC.svg?style=for-the-badge&logo=typescript&logoColor=white)

[Food ordering - TypeScript](typescript/food-ordering): Integrate Restate with external services
```shell
# Download the example
wget https://github.com/restatedev/examples/releases/latest/download/typescript-food-ordering.zip && unzip typescript-food-ordering.zip -d typescript-food-ordering && rm typescript-food-ordering.zip
```

[Ticket reservation](typescript/ticket-reservation): Example showing Restate's keyed-sharding and concurrency guarantees
```shell
# Download the example
wget https://github.com/restatedev/examples/releases/latest/download/typescript-ticket-reservation.zip && unzip typescript-ticket-reservation.zip -d typescript-ticket-reservation && rm typescript-ticket-reservation.zip
```

[Ecommerce store](typescript/ecommerce-store): An ecommerce store completely built on top of Restate
```shell
# Download the example
wget https://github.com/restatedev/examples/releases/latest/download/typescript-ecommerce-store.zip && unzip typescript-ecommerce-store.zip -d typescript-ecommerce-store && rm typescript-ecommerce-store.zip
```

![Java](https://img.shields.io/badge/java-%23ED8B00.svg?style=for-the-badge&logo=openjdk&logoColor=white)

[Food ordering - Java](java/food-ordering): Java food order processing app and driver-to-delivery matching services.
```shell
# Download the example
wget https://github.com/restatedev/examples/releases/latest/download/java-food-ordering.zip && unzip java-food-ordering.zip -d java-food-ordering && rm java-food-ordering.zip
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
curl -X POST http://localhost:9070/deployments -H 'content-type: application/json' -d '{"uri": "http://host.docker.internal:9080"}'
```
- For Linux:
```shell
curl -X POST http://localhost:9070/deployments -H 'content-type: application/json' -d '{"uri": "http://localhost:9080"}'
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

## Adding examples (for Restate developers)

When adding a new example:

* Make sure it has a `.gitignore` file and a README
* Add it to this README
* Check it's tested both in [`test.yaml`](./.github/workflows/test.yml) and [`pre-release.yaml`](./.github/workflows/pre-release.yml)
* Add it to the [zips script](./scripts/prepare_release_zip.sh) and [`release.yaml`](./.github/workflows/release.yml)

## Releasing (for Restate developers)

Before releasing, trigger the "pre-release" workflow to update sdk versions. This automatically creates a pull request, which must be manually merged.

Once the repo is ready for the release, push a tag of the form `vX.Y.Z`.

This triggers a workflow that [creates a draft release](https://github.com/restatedev/examples/releases) on Github, which you need to approve to finalize it.
