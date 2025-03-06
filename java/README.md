# Java Example Catalog

## Prerequisites
- JDK >= 17

## Basics

- **[Services - Durable Execution](basics)**: Making code resilient to failures via automatic retries and recovery of previously finished actions. [<img src="https://raw.githubusercontent.com/restatedev/img/refs/heads/main/play-button.svg" width="16" height="16">](basics/src/main/java/durable_execution/SubscriptionService.java)
- **[Durable Building Blocks](basics)**: Restate turns familiar programming constructs into recoverable, distributed building blocks. Discover what you can do with the SDK. [<img src="https://raw.githubusercontent.com/restatedev/img/refs/heads/main/play-button.svg" width="16" height="16">](basics/src/main/java/building_blocks/MyService.java)
- **[Virtual Objects](basics)**: Stateful services with access to long-lasting, consistent K/V state.  [<img src="https://raw.githubusercontent.com/restatedev/img/refs/heads/main/play-button.svg" width="16" height="16">](basics/src/main/java/virtual_objects/GreeterObject.java)
- **[Workflows](basics)**: Durable sequences of steps that can be queried, signaled and awaited. [<img src="https://raw.githubusercontent.com/restatedev/img/refs/heads/main/play-button.svg" width="16" height="16">](basics/src/main/java/workflows/SignupWorkflow.java)

## Use Cases and Patterns

#### Communication
- **[Durable RPC, Idempotency & Concurrency](patterns-use-cases/README.md#durable-rpc-idempotency--concurrency)**: Restate persists requests and makes sure they execute exactly-once. [<img src="https://raw.githubusercontent.com/restatedev/img/refs/heads/main/play-button.svg" width="16" height="16">](patterns-use-cases/src/main/java/my/example/durablerpc/MyClient.java)
- **[(Delayed) Message Queue](patterns-use-cases/README.md#delayed-message-queue)**: Use Restate as a queue. Schedule tasks for now or later and ensure the task is only executed once. [<img src="https://raw.githubusercontent.com/restatedev/img/refs/heads/main/play-button.svg" width="16" height="16">](patterns-use-cases/src/main/java/my/example/queue/TaskSubmitter.java)
- **[Convert Sync Tasks to Async](patterns-use-cases/README.md#convert-sync-tasks-to-async)**: Kick off a synchronous task (e.g. data upload) and turn it into an asynchronous one if it takes too long. [<img src="https://raw.githubusercontent.com/restatedev/img/refs/heads/main/play-button.svg" width="16" height="16">](patterns-use-cases/src/main/java/my/example/syncasync/UploadClient.java)

#### Orchestration patterns
- **[Sagas](patterns-use-cases/README.md#sagas)**: Preserve consistency by tracking undo actions and running them when code fails halfway through. [<img src="https://raw.githubusercontent.com/restatedev/img/refs/heads/main/play-button.svg" width="16" height="16">](patterns-use-cases/src/main/java/my/example/sagas/BookingWorkflow.java)
- **[Stateful Actors and State Machines](patterns-use-cases/README.md#stateful-actors-and-state-machines)**: State machine with a set of transitions, built as a Restate Virtual Object for automatic state persistence. [<img src="https://raw.githubusercontent.com/restatedev/img/refs/heads/main/play-button.svg" width="16" height="16">](patterns-use-cases/src/main/java/my/example/statefulactors/MachineOperator.java)
- **[Payment State Machines (Advanced)](patterns-use-cases/README.md#payment-state-machines)**: State machine example that tracks a payment process, ensuring consistent processing and cancellations. [<img src="https://raw.githubusercontent.com/restatedev/img/refs/heads/main/play-button.svg" width="16" height="16">](patterns-use-cases/src/main/java/my/example/statemachinepayments/PaymentProcessor.java)

#### Scheduling
- **[Scheduling Tasks](patterns-use-cases/README.md#scheduling-tasks)**: Restate as scheduler: Schedule tasks for later and ensure the task is triggered and executed. [<img src="https://raw.githubusercontent.com/restatedev/img/refs/heads/main/play-button.svg" width="16" height="16">](patterns-use-cases/src/main/java/my/example/schedulingtasks/PaymentTracker.java)
- **[Parallelizing Work](patterns-use-cases/README.md#parallelizing-work)**: Execute a list of tasks in parallel and then gather their result. [<img src="https://raw.githubusercontent.com/restatedev/img/refs/heads/main/play-button.svg" width="16" height="16">](patterns-use-cases/src/main/java/my/example/parallelizework/FanOutWorker.java)
- **[Payments: Async Signals](patterns-use-cases/README.md#payment-signals)**: Handling async payment callbacks for slow payments, with Stripe. [<img src="https://raw.githubusercontent.com/restatedev/img/refs/heads/main/play-button.svg" width="16" height="16">](patterns-use-cases/src/main/java/my/example/signalspayments/PaymentService.java)

#### Event processing
- **[Transactional Event Processing](patterns-use-cases/README.md#transactional-event-processing)**: Processing events (from Kafka) to update various downstream systems in a transactional way. [<img src="https://raw.githubusercontent.com/restatedev/img/refs/heads/main/play-button.svg" width="16" height="16">](patterns-use-cases/src/main/java/my/example/eventtransactions/UserFeed.java)
- **[Event Enrichment / Joins](patterns-use-cases/README.md#event-enrichment--joins)**: Stateful functions/actors connected to Kafka and callable over RPC. [<img src="https://raw.githubusercontent.com/restatedev/img/refs/heads/main/play-button.svg" width="16" height="16">](patterns-use-cases/src/main/java/my/example/eventenrichment/PackageTracker.java)

## Integrations

Examples integrating Restate with other tools and frameworks:

- **[Spring Boot + Spring JPA](integrations/java-spring)**: Reading and writing to Postgres with Spring JPA.

## End-to-End Applications

Complete applications built with Restate:

- **[Food Ordering App](end-to-end-applications/food-ordering)**: A food delivery service (like DoorDash) that manages orders, restaurants, payments, and delivery drivers. The example mixes workflows (ordering) and stateful microservices (driver management), and uses Kafka as an event source for updates from delivery drivers.
- **[Subway Fare Calculator](end-to-end-applications/subway-fare-calculator)**: A fare calculator for a subway system that calculates the fare based on distances traveled by customers. Implemented as Stateful Actors. 
- **[Image Workflow Parser & Executor](end-to-end-applications/workflow-interpreter)**: A dynamic workflow interpreter (Spring Boot) that parses a JSON list of image processing commands and runs them through image processing libraries.

## Templates

Starter templates for new projects:

- **[Java - Gradle Template](templates/java-gradle)**
- **[Java - Maven Template](templates/java-maven)**
- **[Java - Maven - Quarkus Workers Template](templates/java-maven-quarkus)**
- **[Java - Maven - Spring Boot](templates/java-maven-spring-boot)**

## Tutorials

Step-by-step guides to learn Restate:

- **[Tour of Restate](tutorials/tour-of-restate-java)**: An introduction to the SDK features as described in the [documentation](https://docs.restate.dev/get_started/tour).