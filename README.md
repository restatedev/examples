[![Documentation](https://img.shields.io/badge/doc-reference-blue)](https://docs.restate.dev)
[![Discord](https://img.shields.io/discord/1128210118216007792?logo=discord)](https://discord.gg/skW3AZ6uGd)
[![Twitter](https://img.shields.io/twitter/follow/restatedev.svg?style=social&label=Follow)](https://twitter.com/intent/follow?screen_name=restatedev)

# Restate examples

Browse this repository to see how easy distributed applications development becomes with Restate.

## Starters
| Language   | Name / Link                                                          |
|------------|----------------------------------------------------------------------|
| TypeScript | [Hello world on AWS Lambda](typescript/hello-world-lambda)           |
| TypeScript | [Hello world on AWS Lambda + CDK](typescript/hello-world-lambda-cdk) |
| Java       | [Hello World HTTP](java/hello-world-http)                            |
| Java       | [Hello world on AWS Lambda](java/hello-world-lambda)                 |
| Kotlin     | [Hello World HTTP](kotlin/hello-world-http)                          |
| Kotlin     | [Hello world on AWS Lambda](kotlin/hello-world-lambda)               |
| Kotlin     | [Hello world on AWS Lambda + CDK](kotlin/hello-world-lambda-cdk)     |
| Scala      | [Hello world HTTP](scala/hello-world-http)                           |

## Tutorials
| Language    | Name / Link                                                                                   |
|-------------|-----------------------------------------------------------------------------------------------|
| TypeScript  | [Tour of Restate](typescript/tour-of-restate): A tour of the essentials of the Typescript SDK |
| Java     | [Tour of Restate](java/tour-of-restate): A tour of the essentials of the Java SDK |

## Patterns

| Language   | Name / Link                                                                                                             |
|------------|-------------------------------------------------------------------------------------------------------------------------|
| TypeScript | [Payment API](typescript/payment-api): Example API for payments, inspired by the Stripe API                             |
| TypeScript (gRPC API) | [End-to-end testing](typescript/end-to-end-testing): Example of how to test Restate services end-to-end                 |
| TypeScript | [Common patterns](typescript/patterns) Set of common patterns you encounter when developing distributed TS applications |
| Java       | [Common patterns](java/patterns) Set of common patterns you encounter when developing distributed Java applications     |


## Applications

| Language              | Name / Link                                                                                                                                                     |
|-----------------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------|
| TypeScript            | [Food ordering - TypeScript](typescript/food-ordering): Integrate Restate with external services                                                                |
| TypeScript            | [Ticket reservation](typescript/ticket-reservation): Example showing Restate's keyed-sharding and concurrency guarantees                                        |
| TypeScript (gRPC API) | [Ecommerce store](typescript/ecommerce-store): An ecommerce store completely built on top of Restate                                                 |
| TypeScript            | [Dynamic workflow executor](typescript/dynamic-workflow-executor): A workflow executor that dynamically executes a list of steps as specified in the JSON input |
| Java                  | [Food ordering - Java](java/food-ordering): Java food order processing app and driver-to-delivery matching services                                             |


## Joining the community

If you want to join the Restate community in order to stay up to date, then please join our [Discord](https://discord.gg/skW3AZ6uGd).
The Discord server is also the perfect place for sharing your feedback with us, learning more about Restate and connect with others!

## Running the examples

The readme for each example will explain how to get it running. Once the services of the example are running, the deployment needs to be registered in Restate.

### Launching the Restate Server

**NOTE:** Some examples can be run with Docker Compose. For those, you can ignore this section.

For running Restate locally and downloading the binaries, have a look at the options on the [`Get Restate` page](https://restate.dev/get-restate/).

- To run Restate in a Docker container:
    ```shell
    docker run --name restate_dev --rm -p 8080:8080 -p 9070:9070 -p 9071:9071 --add-host=host.docker.internal:host-gateway docker.io/restatedev/restate:latest
    ```
- To run Restate with `npx`:
    ```shell
    npx @restatedev/restate-server@latest
    ```
- To run Restate with Homebrew:
    ```
    brew install restatedev/tap/restate-server
    restate-server 
    ```

### Register the deployment in Restate

Once Restate is up, register the deployment in Restate by executing:

- Via the [CLI](https://docs.restate.dev/restate/cli):
    ```shell
    restate dp register localhost:9080
    ```
- Via `curl`:
    ```shell
    curl localhost:9070/deployments  -H 'content-type: application/json' -d '{"uri": "http://localhost:9080"}'
    ```
  
When running Restate with Docker, use `host.docker.internal` instead of `localhost` for the service deployment URI.

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

Please update the version tag referenced on the [Tour of Restate](https://github.com/restatedev/documentation/blob/main/docs/tour.mdx) documentation page.
