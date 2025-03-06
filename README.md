[![Documentation](https://img.shields.io/badge/doc-reference-blue)](https://docs.restate.dev)
[![Discord](https://img.shields.io/discord/1128210118216007792?logo=discord)](https://discord.gg/skW3AZ6uGd)
[![Slack](https://img.shields.io/discord/1128210118216007792?logo=discord)](https://join.slack.com/t/restatecommunity/shared_invite/zt-2v9gl005c-WBpr167o5XJZI1l7HWKImA)
[![Twitter](https://img.shields.io/twitter/follow/restatedev.svg?style=social&label=Follow)](https://twitter.com/intent/follow?screen_name=restatedev)

# Restate examples

A collection of examples that illustrate how to use Restate to solve common application
challenges.

* **Basics:** Small examples highlighting the basic building blocks, like
  durable execution or virtual objects.
 
* **Use Cases and Patterns:** Small specific use cases, like webhooks,
  workflows, asynchronous task queuing.

* **Integrations:** Examples of integrating Restate with other popular tools, technologies, and libraries.

* **End-to-End Applications:** Runnable demo applications that consist
  of many components, e.g., a food ordering app, or an e-commerce site.
  Typically packaged as a docker compose setup.

* **Templates:** Project templates for various languages, build systems and runtimes.
  Simple 'Hello World!' examples in a proper build setup that you can use if you want to start
  a brand new project for a service or lambda that will be invoked through Restate.

* **Tutorials:** A step-by-step guide that builds an application and introduces
  the Restate concepts on the way.

## Example catalogs 

Have a look at the example catalog for your preferred SDK language:

[![TypeScript](https://skillicons.dev/icons?i=ts)](typescript)
[![Go](https://skillicons.dev/icons?i=go)](go)
[![Python](https://skillicons.dev/icons?i=python&theme=light)](python)
[![Java](https://skillicons.dev/icons?i=java&theme=light)](java)
[![Kotlin](https://skillicons.dev/icons?i=kotlin&theme=light)](kotlin)
[![Rust](https://skillicons.dev/icons?i=rust&theme=light)](rust)

Or have a look at the general catalog below:


#### Basics

| Example Name                                                | Languages                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
|-------------------------------------------------------------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| <a id="durable-execution">Services - Durable Execution</a>  | [<img src="https://skillicons.dev/icons?i=ts" width="24" height="24">](typescript/basics/src/0_durable_execution.ts) [<img src="https://skillicons.dev/icons?i=go" width="24" height="24">](go/basics/part0/durableexecution.go) [<img src="https://skillicons.dev/icons?i=python&theme=light" width="24" height="24">](python/basics/app/0_durable_execution.py) [<img src="https://skillicons.dev/icons?i=java&theme=light" width="24" height="24">](java/basics/src/main/java/durable_execution/SubscriptionService.java) [<img src="https://skillicons.dev/icons?i=kotlin&theme=light" width="24" height="24">](kotlin/basics/src/main/kotlin/durable_execution/SubscriptionService.kt) [<img src="https://skillicons.dev/icons?i=rust&theme=light" width="24" height="24">](rust/basics/src/p0_durable_execution.rs) |
| <a id="durable-building-blocks">Durable Building Blocks</a> | [<img src="https://skillicons.dev/icons?i=ts" width="24" height="24">](typescript/basics/src/1_building_blocks.ts) [<img src="https://skillicons.dev/icons?i=go" width="24" height="24">](go/basics/part1/buildingblocks.go) [<img src="https://skillicons.dev/icons?i=python&theme=light" width="24" height="24">](python/basics/app/1_building_blocks.py) [<img src="https://skillicons.dev/icons?i=java&theme=light" width="24" height="24">](java/basics/src/main/java/building_blocks/MyService.java) [<img src="https://skillicons.dev/icons?i=kotlin&theme=light" width="24" height="24">](kotlin/basics/src/main/kotlin/building_blocks/MyService.kt) [<img src="https://skillicons.dev/icons?i=rust&theme=light" width="24" height="24">](rust/basics/src/p1_building_blocks.rs)                                 |
| <a id="virtual-objects">Virtual Objects</a>                 | [<img src="https://skillicons.dev/icons?i=ts" width="24" height="24">](typescript/basics/src/2_virtual_objects.ts) [<img src="https://skillicons.dev/icons?i=go" width="24" height="24">](go/basics/part2/virtualobjects.go) [<img src="https://skillicons.dev/icons?i=python&theme=light" width="24" height="24">](python/basics/app/2_virtual_objects.py) [<img src="https://skillicons.dev/icons?i=java&theme=light" width="24" height="24">](java/basics/src/main/java/virtual_objects/GreeterObject.java) [<img src="https://skillicons.dev/icons?i=kotlin&theme=light" width="24" height="24">](kotlin/basics/src/main/kotlin/virtual_objects/GreeterObject.kt) [<img src="https://skillicons.dev/icons?i=rust&theme=light" width="24" height="24">](rust/basics/src/p2_virtual_objects.rs)                         |
| <a id="workflows">Workflows</a>                             | [<img src="https://skillicons.dev/icons?i=ts" width="24" height="24">](typescript/basics/src/3_workflows.ts) [<img src="https://skillicons.dev/icons?i=go" width="24" height="24">](go/basics/part3/workflows.go) [<img src="https://skillicons.dev/icons?i=python&theme=light" width="24" height="24">](python/basics/app/3_workflows.py) [<img src="https://skillicons.dev/icons?i=java&theme=light" width="24" height="24">](java/basics/src/main/java/workflows/SignupWorkflow.java) [<img src="https://skillicons.dev/icons?i=kotlin&theme=light" width="24" height="24">](kotlin/basics/src/main/kotlin/workflows/SignupWorkflow.kt) [<img src="https://skillicons.dev/icons?i=rust&theme=light" width="24" height="24">](rust/basics/src/p3_workflows.rs)                                                          |

#### Use Cases and Patterns

| Example Name                                                              | Languages                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
|---------------------------------------------------------------------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| <a id="durable-rpc">Durable RPC, Idempotency & Concurrency</a>            | [<img src="https://skillicons.dev/icons?i=ts" width="24" height="24">](typescript/patterns-use-cases/README.md#durable-rpc-idempotency--concurrency) [<img src="https://skillicons.dev/icons?i=go" width="24" height="24">](go/patterns-use-cases/README.md#durable-rpc-idempotency--concurrency) [<img src="https://skillicons.dev/icons?i=python&theme=light" width="24" height="24">](python/patterns-use-cases/README.md#durable-rpc-idempotency--concurrency) [<img src="https://skillicons.dev/icons?i=java&theme=light" width="24" height="24">](java/patterns-use-cases/README.md#durable-rpc-idempotency--concurrency)                                                                                                                                    |
| <a id="message-queue">\(Delayed\) Message Queue</a>                       | [<img src="https://skillicons.dev/icons?i=ts" width="24" height="24">](typescript/patterns-use-cases/README.md#delayed-message-queue) [<img src="https://skillicons.dev/icons?i=go" width="24" height="24">](go/patterns-use-cases/README.md#delayed-message-queue) [<img src="https://skillicons.dev/icons?i=python&theme=light" width="24" height="24">](python/patterns-use-cases/README.md#delayed-message-queue) [<img src="https://skillicons.dev/icons?i=java&theme=light" width="24" height="24">](java/patterns-use-cases/README.md#delayed-message-queue) [<img src="https://skillicons.dev/icons?i=kotlin&theme=light" width="24" height="24">](kotlin/patterns-use-cases/README.md#delayed-message-queue)                                               |
| <a id="webhook-callbacks">Webhook Callbacks</a>                           | [<img src="https://skillicons.dev/icons?i=ts" width="24" height="24">](typescript/patterns-use-cases/README.md#webhook-callbacks) [<img src="https://skillicons.dev/icons?i=go" width="24" height="24">](go/patterns-use-cases/README.md#webhook-callbacks)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| <a id="database-interaction">Database Interaction Patterns</a>            | [<img src="https://skillicons.dev/icons?i=ts" width="24" height="24">](typescript/patterns-use-cases/README.md#database-interaction-patterns)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| <a id="sync-to-async">Convert Sync Tasks to Async</a>                     | [<img src="https://skillicons.dev/icons?i=ts" width="24" height="24">](typescript/patterns-use-cases/README.md#convert-sync-tasks-to-async) [<img src="https://skillicons.dev/icons?i=go" width="24" height="24">](go/patterns-use-cases/README.md#convert-sync-tasks-to-async) [<img src="https://skillicons.dev/icons?i=python&theme=light" width="24" height="24">](python/patterns-use-cases/README.md#convert-sync-tasks-to-async) [<img src="https://skillicons.dev/icons?i=java&theme=light" width="24" height="24">](java/patterns-use-cases/README.md#convert-sync-tasks-to-async)                                                                                                                                                                        |
| <a id="payment-signals">Payments Signals \(Advanced\)</a>                 | [<img src="https://skillicons.dev/icons?i=ts" width="24" height="24">](typescript/patterns-use-cases/README.md#payment-signals) [<img src="https://skillicons.dev/icons?i=python&theme=light" width="24" height="24">](python/patterns-use-cases/README.md#payment-signals) [<img src="https://skillicons.dev/icons?i=java&theme=light" width="24" height="24">](java/patterns-use-cases/README.md#payment-signals)                                                                                                                                                                                                                                                                                                                                                |
| <a id="sagas">Sagas</a>                                                   | [<img src="https://skillicons.dev/icons?i=ts" width="24" height="24">](typescript/patterns-use-cases/README.md#sagas) [<img src="https://skillicons.dev/icons?i=go" width="24" height="24">](go/patterns-use-cases/README.md#sagas) [<img src="https://skillicons.dev/icons?i=python&theme=light" width="24" height="24">](python/patterns-use-cases/README.md#sagas) [<img src="https://skillicons.dev/icons?i=java&theme=light" width="24" height="24">](java/patterns-use-cases/README.md#sagas) [<img src="https://skillicons.dev/icons?i=kotlin&theme=light" width="24" height="24">](kotlin/patterns-use-cases/README.md#sagas)                                                                                                                              |
| <a id="stateful-actors">Stateful Actors and State Machines</a>            | [<img src="https://skillicons.dev/icons?i=ts" width="24" height="24">](typescript/patterns-use-cases/README.md#stateful-actors-and-state-machines) [<img src="https://skillicons.dev/icons?i=go" width="24" height="24">](go/patterns-use-cases/README.md#stateful-actors-and-state-machines) [<img src="https://skillicons.dev/icons?i=python&theme=light" width="24" height="24">](python/patterns-use-cases/README.md#stateful-actors-and-state-machines) [<img src="https://skillicons.dev/icons?i=java&theme=light" width="24" height="24">](java/patterns-use-cases/README.md#stateful-actors-and-state-machines)                                                                                                                                            |
| <a id="payment-state-machines">Payment State Machines \(Advanced\)</a>    | [<img src="https://skillicons.dev/icons?i=ts" width="24" height="24">](typescript/patterns-use-cases/README.md#payment-state-machines) [<img src="https://skillicons.dev/icons?i=python&theme=light" width="24" height="24">](python/patterns-use-cases/README.md#payment-state-machines) [<img src="https://skillicons.dev/icons?i=java&theme=light" width="24" height="24">](java/patterns-use-cases/README.md#payment-state-machines)                                                                                                                                                                                                                                                                                                                           |
| <a id="scheduling-tasks">Scheduling Tasks</a>                             | [<img src="https://skillicons.dev/icons?i=ts" width="24" height="24">](typescript/patterns-use-cases/README.md#scheduling-tasks) [<img src="https://skillicons.dev/icons?i=go" width="24" height="24">](go/patterns-use-cases/README.md#scheduling-tasks)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| <a id="parallelizing-work">Parallelizing Work</a>                         | [<img src="https://skillicons.dev/icons?i=ts" width="24" height="24">](typescript/patterns-use-cases/README.md#parallelizing-work) [<img src="https://skillicons.dev/icons?i=go" width="24" height="24">](go/patterns-use-cases/README.md#parallelizing-work) [<img src="https://skillicons.dev/icons?i=python&theme=light" width="24" height="24">](python/patterns-use-cases/README.md#parallelizing-work) [<img src="https://skillicons.dev/icons?i=java&theme=light" width="24" height="24">](java/patterns-use-cases/README.md#parallelizing-work)                                                                                                                                                                                                            |
| <a id="transactional-event-processing">Transactional Event Processing</a> | [<img src="https://skillicons.dev/icons?i=ts" width="24" height="24">](typescript/patterns-use-cases/README.md#transactional-event-processing) [<img src="https://skillicons.dev/icons?i=go" width="24" height="24">](go/patterns-use-cases/README.md#transactional-event-processing) [<img src="https://skillicons.dev/icons?i=python&theme=light" width="24" height="24">](python/patterns-use-cases/README.md#transactional-event-processing) [<img src="https://skillicons.dev/icons?i=java&theme=light" width="24" height="24">](java/patterns-use-cases/README.md#transactional-event-processing) [<img src="https://skillicons.dev/icons?i=kotlin&theme=light" width="24" height="24">](kotlin/patterns-use-cases/README.md#transactional-event-processing) |
| <a id="event-enrichment">Event Enrichment / Joins</a>                     | [<img src="https://skillicons.dev/icons?i=ts" width="24" height="24">](typescript/patterns-use-cases/README.md#event-enrichment--joins) [<img src="https://skillicons.dev/icons?i=go" width="24" height="24">](go/patterns-use-cases/README.md#event-enrichment--joins) [<img src="https://skillicons.dev/icons?i=python&theme=light" width="24" height="24">](python/patterns-use-cases/README.md#event-enrichment--joins) [<img src="https://skillicons.dev/icons?i=java&theme=light" width="24" height="24">](java/patterns-use-cases/README.md#event-enrichment--joins) [<img src="https://skillicons.dev/icons?i=kotlin&theme=light" width="24" height="24">](kotlin/patterns-use-cases/README.md#event-enrichment--joins)                                    |
| <a id="promise-as-a-service">Durable Promises as a Service</a>            | [<img src="https://skillicons.dev/icons?i=ts" width="24" height="24">](typescript/patterns-use-cases/README.md#durable-promises-as-a-service)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| <a id="priority-queue">Priority Queue</a>                                 | [<img src="https://skillicons.dev/icons?i=ts" width="24" height="24">](typescript/patterns-use-cases/README.md#priority-queue)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |

#### Integrations

| Example Name                            | Languages                                                                                                                                                                                                                                                                                                                                  |
|-----------------------------------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| <a id="aws-lambda">AWS Lambda + CDK</a> | [<img src="https://skillicons.dev/icons?i=ts" width="24" height="24">](typescript/integrations/deployment-lambda-cdk) [<img src="https://skillicons.dev/icons?i=go" width="24" height="24">](go/integrations/go-lambda-cdk)  [<img src="https://skillicons.dev/icons?i=kotlin&theme=light" width="24" height="24">](kotlin/integrations/kotlin-gradle-lambda-cdk) |
| <a id="xstate">XState</a>               | [<img src="https://skillicons.dev/icons?i=ts" width="24" height="24">](typescript/integrations/xstate)                                                                                                                                                                                                                                     |
| <a id="knative">Knative</a>             | [<img src="https://skillicons.dev/icons?i=go" width="24" height="24">](go/integrations/knative-go)                                                                                                                                                                                                                                         |

#### End-to-End Applications

| Example Name                                                | Languages                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
|-------------------------------------------------------------|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| <a id="food-ordering">Food Ordering App</a>                 | [<img src="https://skillicons.dev/icons?i=ts" width="24" height="24">](typescript/end-to-end-applications/food-ordering) [<img src="https://skillicons.dev/icons?i=python&theme=light" width="24" height="24">](python/end-to-end-applications/food-ordering) [<img src="https://skillicons.dev/icons?i=java&theme=light" width="24" height="24">](java/end-to-end-applications/food-ordering) [<img src="https://skillicons.dev/icons?i=kotlin&theme=light" width="24" height="24">](kotlin/end-to-end-applications/food-ordering) |
| <a id="ai-image-workflows">AI Image Workflow Parser & Executor</a> | [<img src="https://skillicons.dev/icons?i=ts" width="24" height="24">](typescript/end-to-end-applications/ai-image-workflows)                                                                                                                                                                                                                                                                                                                                                                                                       |
| <a id="chat-bot">LLM-powered Chat Bot / Task Agent</a>      | [<img src="https://skillicons.dev/icons?i=ts" width="24" height="24">](typescript/end-to-end-applications/chat-bot)                                                                                                                                                                                                                                                                                                                                                                                                                 |
| <a id="subway-fare-calculator">Subway Fare Calculator</a>   | [<img src="https://skillicons.dev/icons?i=java&theme=light" width="24" height="24">](java/end-to-end-applications/subway-fare-calculator)                                                                                                                                                                                                                                                                                                                                                                                           |
| <a id="rag-ingestion">RAG Ingestion</a>                     | [<img src="https://skillicons.dev/icons?i=python&theme=light" width="24" height="24">](python/end-to-end-applications/rag-ingestion)                                                                                                                                                                                                                                                                                                                                                                                                |
| <a id="kmp-android-todo-app">Kotlin Todo App</a>            | [<img src="https://skillicons.dev/icons?i=kotlin&theme=light" width="24" height="24">](kotlin/end-to-end-applications/kmp-android-todo-app)                                                                                                                                                                                                                                                                                                                                                                                         |

#### Templates

[<img src="https://skillicons.dev/icons?i=ts" width="24" height="24">](typescript/templates)
[<img src="https://skillicons.dev/icons?i=go" width="24" height="24">](go/templates)
[<img src="https://skillicons.dev/icons?i=python&theme=light" width="24" height="24">](python/templates)
[<img src="https://skillicons.dev/icons?i=java&theme=light" width="24" height="24">](java/templates)
[<img src="https://skillicons.dev/icons?i=kotlin&theme=light" width="24" height="24">](kotlin/templates)
[<img src="https://skillicons.dev/icons?i=rust&theme=light" width="24" height="24">](rust/templates)

#### Tour of Restate Tutorial

[<img src="https://skillicons.dev/icons?i=ts" width="24" height="24">](typescript/tutorials/tour-of-restate-typescript)
[<img src="https://skillicons.dev/icons?i=go" width="24" height="24">](go/tutorials/tour-of-restate-go)
[<img src="https://skillicons.dev/icons?i=python&theme=light" width="24" height="24">](python/tutorials/tour-of-restate-python)
[<img src="https://skillicons.dev/icons?i=java&theme=light" width="24" height="24">](java/tutorials/tour-of-restate-java)
[<img src="https://skillicons.dev/icons?i=rust&theme=light" width="24" height="24">](rust/tutorials/tour-of-restate-rust)


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
* Add it to the following catalogs: the one in this readme, the language-specific catalog, and the patterns-use-cases catalog if it is a pattern.
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

Please update the version tag referenced on the [Tour of Restate](https://github.com/restatedev/documentation) documentation page.
