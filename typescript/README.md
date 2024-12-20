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

| Category         | Use case / Name         |                                                     |                                                                                                 | Difficulty   | Description                                                                                                 |
|------------------|-------------------------|-----------------------------------------------------|-------------------------------------------------------------------------------------------------|--------------|-------------------------------------------------------------------------------------------------------------|
| Microservices    | Durable RPC             | [code](src/durablerpc/MyClient.java)                | [README](#microservices-durable-rpc)                                                            | Basic        | Restate persists requests and makes sure they execute exactly-once.                                         |
| Microservices    | Sagas                   | [code](src/sagas/booking_workflow.ts)               | [README](#microservices-sagas)                                                                  | Basic        | Preserve consistency by tracking undo actions and running them when code fails halfway through.             |
| Microservices    | Stateful Actors         | [code](src/statefulactors/machine_operator.ts)      | [README](#microservices-stateful-actors)                                                        | Basic        | State machine with a set of transitions, built as a Restate Virtual Object for automatic state persistence. |
| Microservices    | Payment state machines  | [code](src/statemachinepayments/payment_service.ts) | [README](#microservices-payment-state-machine)                                                  | Advanced     | State machine example that tracks a payment process, ensuring consistent processing and cancellations.      |
| Async tasks      | (Delayed) Task Queue    | [code](src/queue/task_submitter.ts)                 | [README](#async-tasks-delayed-tasks-queue)                                                      | Basic        | Use Restate as a queue. Schedule tasks for now or later and ensure the task is only executed once.          |
| Async tasks      | Parallelizing work      | [code](src/parallelizework/fan_out_worker.ts)       | [README](#async-tasks-parallelizing-work)                                                       | Intermediate | Execute a list of tasks in parallel and then gather their result.                                           |
| Async tasks      | Slow async data upload  | [code](src/dataupload/client.ts)                    | [README](#async-tasks-async-data-upload)                                                        | Intermediate | Kick of a synchronous task (e.g. data upload) and turn it into an asynchronous one if it takes too long.    |
| Async tasks      | Payments: async signals | [code](src/signalspayments/payment_service.ts)      | [README](#async-tasks-payment-signals---combining-sync-and-async-webhook-responses-from-stripe) | Advanced     | Handling async payment callbacks for slow payments, with Stripe.                                            |
| Event processing | Transactional handlers  | [code](src/eventtransactions/user_feed.ts)          | [README](#event-processing-transactional-handlers-with-durable-side-effects-and-timers)         | Basic        | Processing events (from Kafka) to update various downstream systems in a transactional way.                 |
| Event processing | Enriching streams       | [code](src/eventenrichment/package_tracker.ts)      | [README](#event-processing-event-enrichment)                                                    | Basic        | Stateful functions/actors connected to Kafka and callable over RPC.                                         |
| Patterns         | Durable Promises        | [code](durablepromise)                              | [README](#pattern-durable-promise)                                                              | Advanced     | Implementation of Promises/Futures that are durable across processes and failures.                          |
| Patterns         | Priority Queue          | [code](priorityqueue)                               | [README](#pattern-priority-queue)                                                               | Advanced     | Example of implementing a priority queue to manage task execution order.                                    |

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



