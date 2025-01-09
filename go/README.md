# Go Example Catalog

## Basics

- **[Services - Durable Execution](basics)**: Making code resilient to failures via automatic retries and recovery of previously finished actions. [<img src="https://raw.githubusercontent.com/restatedev/img/refs/heads/main/play-button.svg" width="16" height="16">](basics/part0/durableexecution.go)
- **[Durable Building Blocks](basics)**: Restate turns familiar programming constructs into recoverable, distributed building blocks. Discover what you can do with the SDK. [<img src="https://raw.githubusercontent.com/restatedev/img/refs/heads/main/play-button.svg" width="16" height="16">](basics/part1/buildingblocks.go)
- **[Virtual Objects](basics)**: Stateful services with access to long-lasting, consistent K/V state. [<img src="https://raw.githubusercontent.com/restatedev/img/refs/heads/main/play-button.svg" width="16" height="16">](basics/part2/virtualobjects.go)
- **[Workflows](basics)**: Durable sequences of steps that can be queried, signaled and awaited. [<img src="https://raw.githubusercontent.com/restatedev/img/refs/heads/main/play-button.svg" width="16" height="16">](basics/part3/workflows.go)

## Use Cases and Patterns
#### Communication
- **[Durable RPC, Idempotency & Concurrency](patterns-use-cases/README.md#durable-rpc-idempotency-and-concurrency)**: Use programmatic clients to call Restate handlers. Add idempotency keys for deduplication. [<img src="https://raw.githubusercontent.com/restatedev/img/refs/heads/main/play-button.svg" width="16" height="16">](patterns-use-cases/src/durablerpc/client/client.go)
- **[(Delayed) Message Queue](patterns-use-cases/README.md#delayed-message-queue)**: Restate as a queue: Send (delayed) events to handlers. Optionally, retrieve the response later. [<img src="https://raw.githubusercontent.com/restatedev/img/refs/heads/main/play-button.svg" width="16" height="16">](patterns-use-cases/src/queue/client/tasksubmitter.go)
- **[Webhook Callbacks](patterns-use-cases/README.md#webhook-callbacks)**: Point webhook callbacks to a Restate handler for durable event processing. [<img src="https://raw.githubusercontent.com/restatedev/img/refs/heads/main/play-button.svg" width="16" height="16">](patterns-use-cases/src/webhookcallbacks/callbackrouter.go)
- **[Convert Sync Tasks to Async](patterns-use-cases/README.md#convert-sync-tasks-to-async)**: Kick off a synchronous task (e.g. data upload) and convert it to asynchronous if it takes too long. [<img src="https://raw.githubusercontent.com/restatedev/img/refs/heads/main/play-button.svg" width="16" height="16">](patterns-use-cases/src/syncasync/client/client.go)

#### Orchestration patterns
- **[Sagas](patterns-use-cases/README.md#sagas)**: Preserve consistency by tracking undo actions and running them when code fails halfway through. [<img src="https://raw.githubusercontent.com/restatedev/img/refs/heads/main/play-button.svg" width="16" height="16">](patterns-use-cases/src/sagas/bookingworkflow.go)
- **[Stateful Actors and State Machines](patterns-use-cases/README.md#stateful-actors-and-state-machines)**: Stateful Actor representing a machine in our factory. Track state transitions with automatic state persistence. [<img src="https://raw.githubusercontent.com/restatedev/img/refs/heads/main/play-button.svg" width="16" height="16">](patterns-use-cases/src/statefulactors/machineoperator.go)

#### Scheduling
- **[Scheduling Tasks](patterns-use-cases/README.md#scheduling-tasks)**: Restate as scheduler: Schedule tasks for later and ensure the task is triggered and executed. [<img src="https://raw.githubusercontent.com/restatedev/img/refs/heads/main/play-button.svg" width="16" height="16">](patterns-use-cases/src/schedulingtasks/paymentreminders.go)
- **[Parallelizing Work](patterns-use-cases/README.md#parallelizing-work)**: Execute a list of tasks in parallel and then gather their result. [<img src="https://raw.githubusercontent.com/restatedev/img/refs/heads/main/play-button.svg" width="16" height="16">](patterns-use-cases/src/parallelizework/fanoutworker.go)

#### Event processing
- **[Transactional Event Processing](patterns-use-cases/README.md#transactional-event-processing)**: Process events from Kafka to update various downstream systems in a transactional way. [<img src="https://raw.githubusercontent.com/restatedev/img/refs/heads/main/play-button.svg" width="16" height="16">](patterns-use-cases/src/eventtransactions/userfeed.go)
- **[Event Enrichment / Joins](patterns-use-cases/README.md#event-enrichment--joins)**: Stateful functions/actors connected to Kafka and callable over RPC. [<img src="https://raw.githubusercontent.com/restatedev/img/refs/heads/main/play-button.svg" width="16" height="16">](patterns-use-cases/src/eventenrichment/packagetracker.go)

## Integrations

Examples integrating Restate with other tools and frameworks:

- **[AWS Lambda + CDK](integrations/go-lambda-cdk)**: Sample project deploying a Go-based Restate service to AWS Lambda using the AWS Cloud Development Kit (CDK).
- **[KNative](integrations/knative-go)**: Deploying Restate services with KNative.

## Templates

Starter templates for new projects:

- **[Go Template](templates/go)** [<img src="https://raw.githubusercontent.com/restatedev/img/refs/heads/main/play-button.svg" width="16" height="16">](templates/go/greeter.go)

## Tutorials

Step-by-step guides to learn Restate:

- **[Tour of Restate](tutorials/tour-of-restate-go)**: An introduction to the SDK features as described in the [documentation](https://docs.restate.dev/get_started/tour).