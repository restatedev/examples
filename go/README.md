# Go Example Catalog

## Basics

- **[Services - Durable Execution](basics/part0/durableexecution.go)**: Making code resilient to failures via automatic retries and recovery of previously finished actions.
- **[Durable Building Blocks](basics/part1/buildingblocks.go)**: Restate turns familiar programming constructs into recoverable, distributed building blocks. Discover what you can do with the SDK.
- **[Virtual Objects](basics/part3/virtualobjects.go)**: Stateful services with access to long-lasting, consistent K/V state.
- **[Workflows](basics/part2/workflows.go)**: Durable sequences of steps that can be queried, signaled and awaited.

## Use Cases and Patterns

Common tasks and patterns implemented with Restate:

- **[Durable RPC, Idempotency & Concurrency](patterns-use-cases/README.md#durable-rpc-idempotency-and-concurrency)**: Use programmatic clients to call Restate handlers. Add idempotency keys for deduplication. [(code)](patterns-use-cases/src/durablerpc/express_app.ts)
- **[(Delayed) Message Queue](patterns-use-cases/README.md#delayed-message-queue)**: Restate as a queue: Send (delayed) events to handlers. Optionally, retrieve the response later. [(code)](patterns-use-cases/src/queue/task_submitter.ts)
- **[Sagas](patterns-use-cases/README.md#sagas)**: Preserve consistency by tracking undo actions and running them when code fails halfway through. [(code)](patterns-use-cases/src/sagas/booking_workflow.ts)
- **[Webhook Callbacks](patterns-use-cases/README.md#durable-webhook-event-processing)**: Point webhook callbacks to a Restate handler for durable event processing. [(code)](patterns-use-cases/src/webhookcallbacks/webhook_callback_router.ts)
- **[Scheduling Tasks](patterns-use-cases/README.md#scheduling-tasks)**: Restate as scheduler: Schedule tasks for later and ensure the task is triggered and executed. [(code)](patterns-use-cases/src/schedulingtasks/payment_reminders.ts)
- **[Stateful Actors and State Machines](patterns-use-cases/README.md#stateful-actors-and-durable-state-machines)**: Stateful Actor representing a machine in our factory. Track state transitions with automatic state persistence. [(code)](patterns-use-cases/src/statefulactors/machine_operator.ts)
- **[Transactional Event Processing](patterns-use-cases/README.md#event-processing-transactional-handlers-with-durable-side-effects-and-timers)**: Process events from Kafka to update various downstream systems in a transactional way. [(code)](patterns-use-cases/src/eventtransactions/user_feed.ts)
- **[Event enrichment / Joins](patterns-use-cases/README.md#event-processing-event-enrichment)**: Stateful functions/actors connected to Kafka and callable over RPC. [(code)](patterns-use-cases/src/eventenrichment/package_tracker.ts)
- **[Parallelizing work](patterns-use-cases/README.md#parallelizing-work)**: Execute a list of tasks in parallel and then gather their result. [(code)](patterns-use-cases/src/parallelizework/fan_out_worker.ts)
- **[Turn slow sync tasks into async](patterns-use-cases/README.md#async-data-upload)**: Kick off a synchronous task (e.g. data upload) and turn it into an asynchronous one if it takes too long. [(code)](patterns-use-cases/src/dataupload/client.ts)

## Integrations

Examples integrating Restate with other tools and frameworks:

- **[AWS Lambda + CDK](integrations/go-lambda-cdk)**: Sample project deploying a Go-based Restate service to AWS Lambda using the AWS Cloud Development Kit (CDK).
- **[KNative](integrations/knative-go)**: Deploying Restate services with KNative.

## Templates

Starter templates for new projects:

- **[Go Template](templates/go)**

## Tutorials

Step-by-step guides to learn Restate:

- **[Tour of Restate](tutorials/tour-of-restate-go)**: An introduction to the SDK features as described in the [documentation](https://docs.restate.dev/get_started/tour).