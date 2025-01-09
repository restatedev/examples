# Python Example Catalog

## Basics

Learn the key concepts of Restate:

- **[Services - Durable Execution](basics)**: Making code resilient to failures via automatic retries and recovery of previously finished actions. [<img src="https://raw.githubusercontent.com/restatedev/img/refs/heads/main/play-button.svg" width="16" height="16">](basics/app/0_durable_execution.py)
- **[Durable Building Blocks](basics)**: Restate turns familiar programming constructs into recoverable, distributed building blocks. Discover what you can do with the SDK. [<img src="https://raw.githubusercontent.com/restatedev/img/refs/heads/main/play-button.svg" width="16" height="16">](basics/app/1_building_blocks.py)
- **[Virtual Objects](basics)**: Stateful services with access to long-lasting, consistent K/V state. [<img src="https://raw.githubusercontent.com/restatedev/img/refs/heads/main/play-button.svg" width="16" height="16">](basics/app/2_virtual_objects.py)
- **[Workflows](basics)**: Durable sequences of steps that can be queried, signaled and awaited. [<img src="https://raw.githubusercontent.com/restatedev/img/refs/heads/main/play-button.svg" width="16" height="16">](basics/app/3_workflows.py)

## Use Cases and Patterns

#### Communication
- **[Durable RPC, Idempotency and Concurrency](patterns-use-cases/README.md#durable-rpc-idempotency-and-concurrency)**, Idempotency \& Concurrency: Restate persists requests and makes sure they execute exactly-once. [<img src="https://raw.githubusercontent.com/restatedev/img/refs/heads/main/play-button.svg" width="16" height="16">](patterns-use-cases/src/durablerpc/client.py)
- **[(Delayed) Message Queue](patterns-use-cases/README.md#delayed-message-queue)**: Use Restate as a queue. Schedule tasks for now or later and ensure the task is only executed once. [<img src="https://raw.githubusercontent.com/restatedev/img/refs/heads/main/play-button.svg" width="16" height="16">](patterns-use-cases/src/queue/task_submitter.py)
- **[Convert Sync Tasks to Async](patterns-use-cases/README.md#convert-sync-tasks-to-async)**: Kick off a synchronous task (e.g. data upload) and turn it into an asynchronous one if it takes too long. [<img src="https://raw.githubusercontent.com/restatedev/img/refs/heads/main/play-button.svg" width="16" height="16">](patterns-use-cases/src/dataupload/client.py)

#### Orchestration patterns
- **[Sagas](patterns-use-cases/README.md#sagas)**: Preserve consistency by tracking undo actions and running them when code fails halfway through. [<img src="https://raw.githubusercontent.com/restatedev/img/refs/heads/main/play-button.svg" width="16" height="16">](patterns-use-cases/src/sagas/booking_workflow.py)
- **[Stateful Actors and State Machines](patterns-use-cases/README.md#stateful-actors-and-state-machines)**: State machine with a set of transitions, built as a Restate Virtual Object for automatic state persistence. [<img src="https://raw.githubusercontent.com/restatedev/img/refs/heads/main/play-button.svg" width="16" height="16">](patterns-use-cases/src/statefulactors/machine_operator.py)
- **[Payment State Machines (Advanced)](patterns-use-cases/README.md#payment-state-machines)**: State machine example that tracks a payment process, ensuring consistent processing and cancellations. [<img src="https://raw.githubusercontent.com/restatedev/img/refs/heads/main/play-button.svg" width="16" height="16">](patterns-use-cases/src/statemachinepayments/payment_processor.py)

#### Scheduling
- **[Parallelizing Work](patterns-use-cases/README.md#parallelizing-work)**: Execute a list of tasks in parallel and then gather their result. [<img src="https://raw.githubusercontent.com/restatedev/img/refs/heads/main/play-button.svg" width="16" height="16">](patterns-use-cases/src/parallelizework/fan_out_worker.py)
- **[Payment Signals (Advanced)](patterns-use-cases/README.md#payment-signals)**: Handling async payment callbacks for slow payments, with Stripe. [<img src="https://raw.githubusercontent.com/restatedev/img/refs/heads/main/play-button.svg" width="16" height="16">](patterns-use-cases/src/signalspayments/payment_service.py)

#### Event processing
- **[Transactional Event Processing](patterns-use-cases/README.md#transactional-event-processing)**: Processing events (from Kafka) to update various downstream systems in a transactional way. [<img src="https://raw.githubusercontent.com/restatedev/img/refs/heads/main/play-button.svg" width="16" height="16">](patterns-use-cases/src/eventtransactions/user_feed.py)
- **[Event Enrichment / Joins](patterns-use-cases/README.md#event-enrichment--joins)**: Stateful functions/actors connected to Kafka and callable over RPC. [<img src="https://raw.githubusercontent.com/restatedev/img/refs/heads/main/play-button.svg" width="16" height="16">](patterns-use-cases/src/eventenrichment/package_tracker.py)

## End-to-End Applications

Complete applications built with Restate:

- **[Food Ordering App](end-to-end-applications/food-ordering)**: A food delivery service (like DoorDash) that manages orders, restaurants, payments, and delivery drivers. The example mixes workflows (ordering) and stateful microservices (driver management), and uses Kafka as an event source for updates from delivery drivers.

## Templates

Starter templates for new projects:

- **[Python Template](templates/python)**

## Tutorials

Step-by-step guides to learn Restate:

- **[Tour of Restate](tutorials/tour-of-restate-python)**: An introduction to the SDK features as described in the [documentation](https://docs.restate.dev/get_started/tour).



