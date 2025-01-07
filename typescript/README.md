# TypeScript Example Catalog

## Basics

Learn the key concepts of Restate:

| Name                                   | Description                                                                                          |
|----------------------------------------|------------------------------------------------------------------------------------------------------|
| [Services - Durable Execution](basics) | Making code resilient to failures via automatic retries and recovery of previously finished actions. |
| [Durable Building Blocks](basics) | Restate turns familiar programming constructs into recoverable, distributed building blocks. Discover what you can do with the SDK. |
| [Virtual Objects](basics)              | Stateful services with access to long-lasting, consistent K/V state.                                 |
| [Workflows](basics)                    | Durable sequences of steps that can be queried, signaled and awaited.                                |

## Use Cases and Patterns

Common tasks and patterns implemented with Restate:

| Use case / Pattern                            |                                                          |                                                                                                 | Difficulty   | Description                                                                                                                                                                                          |
|--------------------------------------------|----------------------------------------------------------|-------------------------------------------------------------------------------------------------|--------------|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| Durable RPC, Idempotency and Concurrency   | [code](patterns-use-cases/src/durablerpc/express_app.ts) | [README](patterns-use-cases/README.md#microservices-durable-rpc-idempotency-and-concurrency)                                | Basic        | Use the programmatic clients to invoke Restate handlers. Add idempotency keys for deduplication. And limit concurrency via Virtual Objects.                                                          |
| (Delayed) Message Queue                    | [code](patterns-use-cases/src/queue/task_submitter.ts)                      | [README](patterns-use-cases/README.md#async-tasks-delayed-tasks-queue)                                                      | Basic        | Use Restate as a queue. Send a (delayed) event to a handler. Optionally, retrieve the response later.                                                                                                |
| Sagas                                      | [code](patterns-use-cases/src/sagas/booking_workflow.ts)                    | [README](patterns-use-cases/README.md#microservices-sagas)                                                                  | Basic        | Preserve consistency by tracking undo actions and running them when code fails halfway through. Restate guarantees completion.                                                                       |
| Scheduling Tasks and Durable Webhooks      | [code](src/schedulingtasks/payment_reminders.ts)    | [README](#async-tasks-payment-reminders)                                                        | Basic        | <ul><li>Use Restate as scheduler. Schedule tasks for later and ensure the task is triggered and executed.</li><li>Point webhook callbacks to a Restate handler for durable event processing.</li>    |
| Statuful Actors and Durable State Machines | [code](patterns-use-cases/src/statefulactors/machine_operator.ts)           | [README](patterns-use-cases/README.md#microservices-stateful-actors)                                                        | Basic        | Stateful Actor representing a machine in our factory. The handlers bring the machine up and down and track the state transitions, built as a Restate Virtual Object for automatic state persistence. |
| Event processing: Transactional handlers   | [code](patterns-use-cases/src/eventtransactions/user_feed.ts)               | [README](patterns-use-cases/README.md#event-processing-transactional-handlers-with-durable-side-effects-and-timers)         | Basic        | Processing events (from Kafka) to update various downstream systems in a transactional way.                                                                                                          |
| Event processing: Enriching streams        | [code](patterns-use-cases/src/eventenrichment/package_tracker.ts)           | [README](patterns-use-cases/README.md#event-processing-event-enrichment)                                                    | Basic        | Stateful functions/actors connected to Kafka and callable over RPC.                                                                                                                                  |
| Parallelizing work                         | [code](patterns-use-cases/src/parallelizework/fan_out_worker.ts)            | [README](patterns-use-cases/README.md#async-tasks-parallelizing-work)                                                       | Intermediate | Execute a list of tasks in parallel and then gather their result.                                                                                                                                    |
| Slow async data upload                     | [code](patterns-use-cases/src/dataupload/client.ts)                         | [README](patterns-use-cases/README.md#async-tasks-async-data-upload)                                                        | Intermediate | Kick of a synchronous task (e.g. data upload) and turn it into an asynchronous one if it takes too long.                                                                                             |
| Payment state machines                     | [code](patterns-use-cases/src/statemachinepayments/payment_service.ts)      | [README](patterns-use-cases/README.md#microservices-payment-state-machine)                                                  | Advanced     | State machine example that tracks a payment process, ensuring consistent processing and cancellations.                                                                                               |
| Payments: async signals                    | [code](patterns-use-cases/src/signalspayments/payment_service.ts)           | [README](patterns-use-cases/README.md#async-tasks-payment-signals---combining-sync-and-async-webhook-responses-from-stripe) | Advanced     | Handling async payment callbacks for slow payments, with Stripe.                                                                                                                                     |
| Patterns: Durable Promises                 | [code](patterns-use-cases/durablepromise)                                   | [README](patterns-use-cases/README.md#pattern-durable-promise)                                                              | Advanced     | Custom implementation of Promises/Futures that are durable across processes and failures.                                                                                                            |
| Patterns: Priority Queue                   | [code](patterns-use-cases/patterns-use-cases/priorityqueue)                                    | [README](patterns-use-cases/README.md#pattern-priority-queue)                                                               | Advanced     | Example of implementing a priority queue to manage task execution order.                                                                                                                             |

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



