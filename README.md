[![Documentation](https://img.shields.io/badge/doc-reference-blue)](https://docs.restate.dev)
[![Discord](https://img.shields.io/discord/1128210118216007792?logo=discord)](https://discord.gg/skW3AZ6uGd)
[![Twitter](https://img.shields.io/twitter/follow/restatedev.svg?style=social&label=Follow)](https://twitter.com/intent/follow?screen_name=restatedev)

# Restate examples

A collection of examples that illustrate how to use Restate to solve common application
challenges.

* **[Use Cases and Patterns](patterns-use-cases):** Small specific use cases, like webhooks,
  workflows, asynchronous task queuing.

* **[Basics](basics):** Small examples highlighting the basic building blocks, like
  durable execution or virtual objects.

* **[End-to-End Applications](end-to-end-applications):** Runnable demo applications that consist
  of many components, e.g., a fodo ordering app, or an e-commerce site.
  Typically packaged as a docker compose setup.

* **[Tutorials](tutorials):** A step-by-step guide that builds an application and introduces
  the Restate concepts on the way.

* **[Templates](templates):** Project templates for various languages and build systems.
  Simple 'Hello World!' examples in a proper build setup that you can use if you want to start
  a brand new project for a service or lambda that will be invoked through Restate.


## Examples by Language

### TypeScript

| Type       | Name / Link                                                                                   |
|------------|-----------------------------------------------------------------------------------------------|
| Basics     | [Workflows, Durable Execution, Event-processing, Virtual Objects](basics/basics-typescript)   |
| Use Cases  | [Sagas](patterns-use-cases/sagas/sagas-typescript)                                            |
| Use Cases  | [Durable Promises](patterns-use-cases/durable-promises/durable-promises-typescript)           |
| Use Cases  | [State Machines](patterns-use-cases/state-machines/state-machines-typescript/)                |
| Use Cases  | [Payment Service](patterns-use-cases/payment-state-machine/payment-state-machine-typescript/) |
| End-to-End | [Food Ordering App](end-to-end-applications/typescript/food-ordering)                         |
| End-to-End | [AI Image Processing Workflow](end-to-end-applications/typescript/ai-image-workflows)         |
| End-to-End | [Online Shop](end-to-end-applications/typescript/ecommerce-store/)                            |
| Tutorial   | [Tour of Restate](tutorials/tour-of-restate-typescript)                                       |
| Templates  | [Restate Node/TS Template](templates/typescript)                                              |

### Java

| Type       | Name / Link                                                                                   |
|------------|-----------------------------------------------------------------------------------------------|
| Use Cases  | [Sagas](patterns-use-cases/sagas/sagas-java/)                                                 |
| End-to-End | [Food Ordering App](end-to-end-applications/java/food-ordering)                               |
| Tutorial   | [Tour of Restate](tutorials/tour-of-restate-java/)                                            |
| Templates  | [Restate Node/TS Template](templates/java-gradle/)                                            |

### Kotlin

| Type       | Name / Link                                                                                   |
|------------|-----------------------------------------------------------------------------------------------|
| Templates  | [Restate Node/TS Template](templates/kotlin-gradle/)                                          |

### Scala

| Type       | Name / Link                                                                                   |
|------------|-----------------------------------------------------------------------------------------------|
| Templates  | [Restate Node/TS Template](templates/scala-sbt/)                                              |

## Joining the community

If you want to join the Restate community in order to stay up to date, then please join our [Discord](https://discord.gg/skW3AZ6uGd).
The Discord server is also the perfect place for sharing your feedback with us, learning more about Restate and connect with others!

## Running the examples

Some examples are just illustrations of code, but many are runnable. Their READMEs generally explain
how to get them running. Here are the general steps:

### (1) Starting the Restate Server

Examples that run individually typically need a running Restate Server instance.
Some examples can be run with Docker Compose. Those already bring their own Restate server instance.

You can launch Restate in a number of ways, including using the [Restate Cloud](https://restate.dev/get-restate-cloud/)
service. See [Get Restate](https://restate.dev/get-restate/) for all options to run Restate. Here is a short-list
of options to run Restate Server locally.

Install and run the `restate-server` binary:
  - Download from https://github.com/restatedev/restate/releases
  - Install with Homebrew: `brew install restatedev/tap/restate-server`
  - Install with _npm_: `npm install --global @restatedev/restate-server@latest`

Or run Restate Server in Docker:
  - `docker run --name restate_dev --rm -p 8080:8080 -p 9070:9070 -p 9071:9071 --add-host=host.docker.internal:host-gateway docker.io/restatedev/restate:latest`


### (2) Register the examples at Restate Server

Many examples need to be registered at Restate, so that Restate will proxy their function calls and
do its magic. Once both server and example are running, register the example

* Via the [CLI](https://docs.restate.dev/restate/cli): `restate dp reg localhost:9080`
* Via `curl localhost:9070/deployments -H 'content-type: application/json' -d '{"uri": "http://localhost:9080"}'`

**Important** When running Restate with Docker, use `host.docker.internal` instead of `localhost` in the URIs above.

----
----

## Adding Examples and Releasing (for Restate developers/contributors)

When adding a new example:

* Make sure it has a README
* Add it to this README
* Check it's listed in run tests/update examples scripts in [`.tools`](./.tools)
* Optionally, add it to the [zips script](./.tools/prepare_release_zip.sh) and [`release.yaml`](./.github/workflows/release.yml)

**Creating a Release**

Before releasing, trigger the "pre-release" workflow to update sdk versions. This automatically creates a pull request, which must be manually merged.

Once the repo is ready for the release, push a tag of the form `vX.Y.Z`.

This triggers a workflow that [creates a draft release](https://github.com/restatedev/examples/releases) on Github, which you need to approve to finalize it.

Please update the version tag referenced on the [Tour of Restate](https://github.com/restatedev/documentation/blob/main/docs/tour.mdx) documentation page.
