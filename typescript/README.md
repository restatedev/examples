# TypeScript Example Catalog

## Prerequisites
- NodeJS >= v18.17.1
- npm CLI >= 9.6.7

## Basics

Learn the key concepts of Restate:

- **[Services - Durable Execution](basics)**: Making code resilient to failures via automatic retries and recovery of previously finished actions. [<img src="https://raw.githubusercontent.com/restatedev/img/refs/heads/main/play-button.svg" width="16" height="16">](basics/src/0_durable_execution.ts)
- **[Durable Building Blocks](basics)**: Restate turns familiar programming constructs into recoverable, distributed building blocks. Discover what you can do with the SDK. [<img src="https://raw.githubusercontent.com/restatedev/img/refs/heads/main/play-button.svg" width="16" height="16">](basics/src/1_building_blocks.ts)
- **[Virtual Objects](basics)**: Stateful services with access to long-lasting, consistent K/V state. [<img src="https://raw.githubusercontent.com/restatedev/img/refs/heads/main/play-button.svg" width="16" height="16">](basics/src/2_virtual_objects.ts)
- **[Workflows](basics)**: Durable sequences of steps that can be queried, signaled and awaited. [<img src="https://raw.githubusercontent.com/restatedev/img/refs/heads/main/play-button.svg" width="16" height="16">](basics/src/3_workflows.ts)

## Use Cases and Patterns

Common tasks and patterns implemented with Restate:

#### Communication
- **[Durable RPC, Idempotency & Concurrency](patterns-use-cases/README.md#durable-rpc-idempotency--concurrency)**: Use programmatic clients to call Restate handlers. Add idempotency keys for deduplication. [<img src="https://raw.githubusercontent.com/restatedev/img/refs/heads/main/play-button.svg" width="16" height="16">](patterns-use-cases/src/durablerpc/express_app.ts)
- **[(Delayed) Message Queue](patterns-use-cases/README.md#delayed-message-queue)**: Restate as a queue: Send (delayed) events to handlers. Optionally, retrieve the response later. [<img src="https://raw.githubusercontent.com/restatedev/img/refs/heads/main/play-button.svg" width="16" height="16">](patterns-use-cases/src/queue/task_submitter.ts)
- **[Webhook Callbacks](patterns-use-cases/README.md#webhook-callbacks)**: Point webhook callbacks to a Restate handler for durable event processing. [<img src="https://raw.githubusercontent.com/restatedev/img/refs/heads/main/play-button.svg" width="16" height="16">](patterns-use-cases/src/webhookcallbacks/webhook_callback_router.ts)
- **[Database Interaction Patterns](patterns-use-cases/README.md#database-interaction-patterns)**: Recommended approaches for reading from and writing to databases using Restate handlers. [<img src="https://raw.githubusercontent.com/restatedev/img/refs/heads/main/play-button.svg" width="16" height="16">](patterns-use-cases/src/database/main.ts)
- **[Convert Sync Tasks to Async](patterns-use-cases/README.md#convert-sync-tasks-to-async)**: Kick off a synchronous task (e.g. data upload) and turn it into an asynchronous one if it takes too long. [<img src="https://raw.githubusercontent.com/restatedev/img/refs/heads/main/play-button.svg" width="16" height="16">](patterns-use-cases/src/syncasync/client.ts)
- **[Payments Signals (Advanced)](patterns-use-cases/README.md#payment-signals)**: Combining fast synchronous responses and slow async callbacks for payments, with Stripe. [<img src="https://raw.githubusercontent.com/restatedev/img/refs/heads/main/play-button.svg" width="16" height="16">](patterns-use-cases/src/signalspayments/payment_service.ts)

#### Orchestration patterns
- **[Sagas](patterns-use-cases/README.md#sagas)**: Preserve consistency by tracking undo actions and running them when code fails halfway through. [<img src="https://raw.githubusercontent.com/restatedev/img/refs/heads/main/play-button.svg" width="16" height="16">](patterns-use-cases/src/sagas/booking_workflow.ts)
- **[Stateful Actors and State Machines](patterns-use-cases/README.md#stateful-actors-and-state-machines)**: Stateful Actor representing a machine in our factory. Track state transitions with automatic state persistence. [<img src="https://raw.githubusercontent.com/restatedev/img/refs/heads/main/play-button.svg" width="16" height="16">](patterns-use-cases/src/statefulactors/machine_operator.ts)
- **[Payment State Machines (Advanced)](patterns-use-cases/README.md#payment-state-machines)**: State machine example that tracks a payment process, ensuring consistent processing and cancellations. [<img src="https://raw.githubusercontent.com/restatedev/img/refs/heads/main/play-button.svg" width="16" height="16">](patterns-use-cases/src/statemachinepayments/payment_service.ts)

#### Scheduling
- **[Scheduling Tasks](patterns-use-cases/README.md#scheduling-tasks)**: Restate as scheduler: Schedule tasks for later and ensure the task is triggered and executed. [<img src="https://raw.githubusercontent.com/restatedev/img/refs/heads/main/play-button.svg" width="16" height="16">](patterns-use-cases/src/schedulingtasks/payment_reminders.ts)
- **[Parallelizing Work](patterns-use-cases/README.md#parallelizing-work)**: Execute a list of tasks in parallel and then gather their result. [<img src="https://raw.githubusercontent.com/restatedev/img/refs/heads/main/play-button.svg" width="16" height="16">](patterns-use-cases/src/parallelizework/fan_out_worker.ts)

#### Event processing
- **[Transactional Event Processing](patterns-use-cases/README.md#transactional-event-processing)**: Process events from Kafka to update various downstream systems in a transactional way. [<img src="https://raw.githubusercontent.com/restatedev/img/refs/heads/main/play-button.svg" width="16" height="16">](patterns-use-cases/src/eventtransactions/user_feed.ts)
- **[Event enrichment / Joins](patterns-use-cases/README.md#event-enrichment--joins)**: Stateful functions/actors connected to Kafka and callable over RPC. [<img src="https://raw.githubusercontent.com/restatedev/img/refs/heads/main/play-button.svg" width="16" height="16">](patterns-use-cases/src/eventenrichment/package_tracker.ts)

#### Building coordination constructs (Advanced)
- **[Durable Promises as a Service](patterns-use-cases/README.md#durable-promises-as-a-service)**: Building Promises/Futures as a service, that can be exposed to external clients and are durable across processes and failures. [<img src="https://raw.githubusercontent.com/restatedev/img/refs/heads/main/play-button.svg" width="16" height="16">](patterns-use-cases/src/promiseasaservice)
- **[Priority Queue](patterns-use-cases/README.md#priority-queue)**: Example of implementing a priority queue to manage task execution order. [<img src="https://raw.githubusercontent.com/restatedev/img/refs/heads/main/play-button.svg" width="16" height="16">](patterns-use-cases/src/priorityqueue)

## Integrations

Examples integrating Restate with other tools and frameworks:

- **[AWS Lambda + CDK](integrations/deployment-lambda-cdk)**: Sample project deploying a TypeScript-based Restate service to AWS Lambda using the AWS Cloud Development Kit (CDK).
- **[XState](integrations/xstate)**: Resilient, distributed durable state machines with Restate and XState.


## End-to-End Applications

Complete applications built with Restate:

- **[Food Ordering App](end-to-end-applications/food-ordering)**: A food delivery service (like DoorDash) that manages orders, restaurants, payments, and delivery drivers. The example mixes workflows (ordering) and stateful microservices (driver management), and uses Kafka as an event source for updates from delivery drivers.
- **[AI Image Workflow Parser & Executor](end-to-end-applications/ai-image-workflows)**: A dynamic workflow interpreter that interprets a list of image processing steps and runs them through image processing libraries and stable diffusion.
- **[LLM-powered Chat Bot / Task Agent](end-to-end-applications/chat-bot)**: An LLM-powered chat bot with Slack integration that can be asked to handle tasks, like watching flight prices, or sending reminders.


## Templates

Starter templates for new projects:

- **[Node Template](templates/node)**
- **[Bun Template](templates/bun)** 
- **[CloudFlare Workers Template](templates/cloudflare-worker)**
- **[Deno Template](templates/deno)**

## Tutorials

Step-by-step guides to learn Restate:

- **[Tour of Restate](tutorials/tour-of-restate-typescript)**: An introduction to the SDK features as described in the [documentation](https://docs.restate.dev/get_started/tour).



