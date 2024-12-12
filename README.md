[![Documentation](https://img.shields.io/badge/doc-reference-blue)](https://docs.restate.dev)
[![Discord](https://img.shields.io/discord/1128210118216007792?logo=discord)](https://discord.gg/skW3AZ6uGd)
[![Twitter](https://img.shields.io/twitter/follow/restatedev.svg?style=social&label=Follow)](https://twitter.com/intent/follow?screen_name=restatedev)

# Restate examples

A collection of examples that illustrate how to use Restate to solve common application
challenges.

* **[Templates](#templates):** Project templates for various languages, build systems and runtimes.
  Simple 'Hello World!' examples in a proper build setup that you can use if you want to start
  a brand new project for a service or lambda that will be invoked through Restate.

* **Basics:** Small examples highlighting the basic building blocks, like
  durable execution or virtual objects.
 
* **Use Cases and Patterns:** Small specific use cases, like webhooks,
  workflows, asynchronous task queuing.

* **Integrations:** Examples of integrating Restate with other popular tools, technologies, and libraries.

* **End-to-End Applications:** Runnable demo applications that consist
  of many components, e.g., a food ordering app, or an e-commerce site.
  Typically packaged as a docker compose setup.

* **Tutorials:** A step-by-step guide that builds an application and introduces
  the Restate concepts on the way.

[![TypeScript](https://skillicons.dev/icons?i=ts)](typescript)
[![Java](https://skillicons.dev/icons?i=java)](java)
[![Rust](https://skillicons.dev/icons?i=rust)](rust)
[![Python](https://skillicons.dev/icons?i=python)](python)
[![Go](https://skillicons.dev/icons?i=go)](go)
[![Kotlin](https://skillicons.dev/icons?i=kotlin)](kotlin)


## Example catalog

### Templates
| Name / Link                                                              |
|--------------------------------------------------------------------------|
| [TypeScript - Node Template](templates/typescript)                       |
| [TypeScript - Bun Template](templates/bun)                               |
| [TypeScript - CloudFlare Workers Template](templates/cloudflare-workers) |
| [TypeScript - Deno Template](templates/deno)                             |
| [Java - Maven Template](templates/java-maven)                            |
| [Java - Maven - Spring Boot Template](templates/java-maven-spring-boot)  |
| [Java - Maven - Quarkus Template](templates/java-maven-quarkus)          |
| [Java - Gradle Template](templates/java-gradle)                          |
| [Python Template](templates/python)                                      |
| [Kotlin Template using Gradle](templates/kotlin-gradle)                  |
| [Go Template](templates/go)                                              |
| [Rust Template](templates/rust)                                          |
| [Rust - Shuttle.rs Template](templates/rust-shuttle)                     |

### Basics
| Name                         | Language / Link                                                                                                            | Description                                                                                          |
|------------------------------|----------------------------------------------------------------------------------------------------------------------------|------------------------------------------------------------------------------------------------------|
| Services - Durable Execution | [TS](basics/basics-typescript), [Java](basics/basics-java), [Python](basics/basics-python), [Kotlin](basics/basics-kotlin) | Making code resilient to failures via automatic retries and recovery of previously finished actions. |
| Virtual Objects              | [TS](basics/basics-typescript), [Java](basics/basics-java), [Python](basics/basics-python), [Kotlin](basics/basics-kotlin) | Stateful objects to manage durable, consistent state.                                                |
| Workflows                    | [TS](basics/basics-typescript), [Java](basics/basics-java), [Python](basics/basics-python), [Kotlin](basics/basics-kotlin) |                                                                                                      |


### Use Cases and Patterns
| Name                   | Language / Link                                                                                                                                                | Description |
|------------------------|----------------------------------------------------------------------------------------------------------------------------------------------------------------|-------------|
| Sagas                  | [TS](patterns-use-cases/sagas/sagas-typescript), [Java](patterns-use-cases/sagas/sagas-java), [Kotlin](patterns-use-cases/sagas/sagas-kotlin)                  |
| Durable Promises       | [TS](patterns-use-cases/durable-promises/durable-promises-typescript)                                                                                          |
| State Machines         | [TS](patterns-use-cases/state-machines/state-machines-typescript/)                                                                                             |
| Payment Service        | [TS](patterns-use-cases/payment-state-machine/payment-state-machine-typescript/), [Java](patterns-use-cases/payment-state-machine/payment-state-machine-java/) |
| Async Tasks - Payments | [TS](patterns-use-cases/async-signals-payment/async-signals-payment-typescript/), [Java](patterns-use-cases/async-signals-payment/async-signals-payment-java/) |

### Integrations
| Name / Link                                                               | Description |
|---------------------------------------------------------------------------|-------------|
| [Java - Spring & Spring JPA](patterns-use-cases/integrations/java-spring) |             |
| [Go + Knative](tutorials/knative-go)                                      |


### End-to-End Applications
| Name                                    | Language / Link                                                                                                                                                                                                            | Description |
|-----------------------------------------|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|-------------|
| Food Ordering App                       | [TS](end-to-end-applications/typescript/food-ordering), [Java](end-to-end-applications/java/food-ordering), [Kotlin](end-to-end-applications/kotlin/food-ordering), [Python](end-to-end-applications/python/food-ordering) |             |
| AI Image Processing Workflow            | [TS](end-to-end-applications/typescript/ai-image-workflows)                                                                                                                                                                |             |
| LLM-powered Chat Bot / Task Agent       | [TS](end-to-end-applications/typescript/chat-bot)                                                                                                                                                                          |             |
| Todo app Kotlin Multiplatform + Android | [Kotlin](end-to-end-applications/kotlin/kmp-android-todo-app)                                                                                                                                                              |             |


### Tutorials
| Name            | Language / Link                                                                                                                                                                                             | Description |
|-----------------|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|-------------|
| Tour of Restate | [TS](tutorials/tour-of-restate-typescript), [Java](tutorials/tour-of-restate-java/), [Kotlin](tutorials/tour-of-restate-python), [Rust](tutorials/tour-of-restate-rust), [Go](tutorials/tour-of-restate-go) |             |


## Joining the community

If you want to join the Restate community in order to stay up to date, then please join our [Discord](https://discord.gg/skW3AZ6uGd) or [Slack](https://join.slack.com/t/restatecommunity/shared_invite/zt-2v9gl005c-WBpr167o5XJZI1l7HWKImA).
This is also the perfect place for sharing your feedback with us, learning more about Restate and connect with others!

## Running the examples

Some examples are just illustrations of code, but many are runnable. Their READMEs explain
how to get them running. Here are the general steps:

### (1) Starting the Restate Server

To run an example locally, you need a running Restate Server instance.
Some examples can be run with Docker Compose. Those already bring their own Restate server instance.

To install the Restate Server and CLI, have a look at the [installation instructions in the documentation](https://docs.restate.dev/develop/local_dev#running-restate-server--cli-locally).

### (2) Register the examples at Restate Server

The service endpoints need to be registered in Restate, so that Restate will proxy their function calls and
do its magic. Once both server and example are running, register the example:

* Via the [CLI](https://docs.restate.dev/develop/local_dev): `restate deployments register localhost:9080`
* Via `curl localhost:9070/deployments -H 'content-type: application/json' -d '{"uri": "http://localhost:9080"}'`

**Important** When running Restate with Docker, use `host.docker.internal` instead of `localhost` in the URIs above.

---

## Adding Examples and Releasing (for Restate developers/contributors)

When adding a new example:

* Make sure it has a README
* Add it to this README
* Check it's listed in run tests/update examples scripts in [`.tools`](./.tools)
* Optionally, add it to the [zips script](./.tools/prepare_release_zip.sh) and [`release.yaml`](./.github/workflows/release.yml)

**Creating a Release**

Before releasing, trigger the "pre-release" workflow to update sdk versions. This automatically creates a pull request, which must be manually merged.

Once the repo is ready for the release, push a tag of the form `vX.Y.Z`:

```shell
git checkout main
git tag -m "Examples v0.9.1" v0.9.1
git push origin v0.9.1
```

This triggers a workflow that [creates a draft release](https://github.com/restatedev/examples/releases) on GitHub, which you need to approve to finalize it.

Please update the version tag referenced on the [Tour of Restate](https://github.com/restatedev/documentation/blob/main/docs/tour.mdx) documentation page.
