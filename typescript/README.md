# TypeScript Example Catalog

## Basics

Learn the key concepts of Restate:

| Name                                   | Description                                                                                          |
|----------------------------------------|------------------------------------------------------------------------------------------------------|
| [Services - Durable Execution](basics) | Making code resilient to failures via automatic retries and recovery of previously finished actions. |
| [Virtual Objects](basics)              | Stateful services with access to long-lasting, consistent K/V state.                                 |
| [Workflows](basics)                    | Durable sequences of steps that can be queried, signaled and awaited.                                |

## Use Cases and Patterns

Common tasks and patterns implemented with Restate:

| Use case / Name                                                                      | Difficulty   | Description                                                                                                 |
|--------------------------------------------------------------------------------------|--------------|-------------------------------------------------------------------------------------------------------------|
| **Microservices**:                                                                   |              |                                                                                                             |
| [Durable RPC](patterns-use-cases/microservices-durable-rpc)                          | Basic        | Restate persists requests and makes sure they execute exactly-once.                                         |
| [Sagas](patterns-use-cases/microservices-sagas)                                      | Basic        | Preserve consistency by tracking undo actions and running them when code fails halfway through.             |
| [Stateful Actors](patterns-use-cases/microservices-stateful-actors)                  | Basic        | State machine with a set of transitions, built as a Restate Virtual Object for automatic state persistence. |
| [Payment state machines](patterns-use-cases/microservices-payment-state-machines)    | Advanced     | State machine example that tracks a payment process, ensuring consistent processing and cancellations.      |
| **Async tasks**:                                                                     |              |                                                                                                             |
| [(Delayed) Task Queue](patterns-use-cases/async-tasks-queue)                         | Basic        | Use Restate as a queue. Schedule tasks for now or later and ensure the task is only executed once.          |
| [Parallelizing work](patterns-use-cases/async-tasks-parallelize-work)                | Intermediate | Execute a list of tasks in parallel and then gather their result.                                           |
| [Slow async data upload](patterns-use-cases/async-tasks-data-upload)                 | Intermediate | Kick of a synchronous task (e.g. data upload) and turn it into an asynchronous one if it takes too long.    |
| [Payments: async signals processing](patterns-use-cases/async-tasks-payment-signals) | Advanced     | Handling async payment callbacks for slow payments, with Stripe.                                            |
| **Event processing**:                                                                |              |                                                                                                             |
| [Transactional handlers](patterns-use-cases/event-processing-transactional-handlers) | Basic        | Processing events (from Kafka) to update various downstream systems in a transactional way.                 |
| [Enriching streams](patterns-use-cases/event-processing-enrichment)                  | Intermediate | Stateful functions/actors connected to Kafka and callable over RPC.                                         |
| **Patterns**:                                                                        |              |                                                                                                             |
| [Durable Promises](patterns-use-cases/pattern-durable-promises)                      | Advanced     | Implementation of Promises/Futures that are durable across processes and failures.                          |
| [Priority Queue](patterns-use-cases/pattern-priority-queue)                          | Advanced     | Example of implementing a priority queue to manage task execution order.                                    |

## Integrations

Examples integrating Restate with other tools and frameworks:

| Name / Link                                            | Description                                                                                                          |
|--------------------------------------------------------|----------------------------------------------------------------------------------------------------------------------|
| [AWS Lambda + CDK](integrations/deployment-lambda-cdk) | Sample project deploying a TypeScript-based Restate service to AWS Lambda using the AWS Cloud Development Kit (CDK). |
| [XState](integrations/xstate)                          | Resilient, distributed durable state machines with Restate and XState                                                |


## End-to-End Applications

Complete applications built with Restate:

| Name/Link                                                                  | Description                                                                                                                                                                                                                                                           |
|----------------------------------------------------------------------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| [Food Ordering App](end-to-end-applications/food-ordering)                 | A food delivery service (like DoorDash) that manages orders, restaurants, payments, and delivery drivers. The example mixes workflows (ordering) and stateful microservices (driver management), and uses Kafka as an event source for updates from delivery drivers. |
| [AI Image Processing Workflow](end-to-end-applications/ai-image-workflows) | A dynamic workflow interpreter that interprets a list of image processing steps and runs them through image processing libraries and stable diffusion.                                                                                                                |
| [LLM-powered Chat Bot / Task Agent](end-to-end-applications/chat-bot)      | An LLM-powered chat bot with Slack integration that can be asked to handle tasks, like watching flight prices, or sending reminders.                                                                                                                                  |                                                                                     |


## Templates

Starter templates for new projects:

| Name / Link                                                |
|------------------------------------------------------------|
| [Node Template](templates/node)                            |
| [Bun Template](templates/bun)                              |
| [CloudFlare Workers Template](templates/cloudflare-worker) |
| [Deno Template](templates/deno)                            |

## Tutorials

Step-by-step guides to learn Restate:

| Name / Link                                             | Description                                                                                                         |
|---------------------------------------------------------|---------------------------------------------------------------------------------------------------------------------|
| [Tour of Restate](tutorials/tour-of-restate-typescript) | An introduction to the SDK features as described in the [documentation](https://docs.restate.dev/get_started/tour). |



