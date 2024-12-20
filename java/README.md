# Java Example Catalog

## Basics

Learn the key concepts of Restate:

| Name                                   | Description                                                                                          |
|----------------------------------------|------------------------------------------------------------------------------------------------------|
| [Services - Durable Execution](basics) | Making code resilient to failures via automatic retries and recovery of previously finished actions. |
| [Virtual Objects](basics)              | Stateful services with access to long-lasting, consistent K/V state.                                 |
| [Workflows](basics)                    | Durable sequences of steps that can be queried, signaled and awaited.                                |

## Use Cases and Patterns

Common tasks and patterns implemented with Restate:

| Category         | Use case / Name                          |                                                                             |                                                                                                                     | Difficulty  | Description                                                                                                 |
|------------------|------------------------------------------|-----------------------------------------------------------------------------|---------------------------------------------------------------------------------------------------------------------|-------------|-------------------------------------------------------------------------------------------------------------|
| Microservices    | Durable RPC | [code](patterns-use-cases/src/main/java/my/example/durablerpc/MyClient.java)                   | [README](patterns-use-cases/README.md#microservices-durable-rpc)                                                                                | Basic        | Restate persists requests and makes sure they execute exactly-once.                                         |
| Microservices    | Sagas | [code](patterns-use-cases/src/main/java/my/example/sagas/BookingWorkflow.java)                 | [README](patterns-use-cases/README.md#microservices-sagas)                                                                                      | Basic        | Preserve consistency by tracking undo actions and running them when code fails halfway through.             |
| Microservices    | Stateful Actors | [code](patterns-use-cases/src/main/java/my/example/statefulactors/MachineOperator.java)        | [README](patterns-use-cases/README.md#microservices-stateful-actors)                                                                            | Basic                          | State machine with a set of transitions, built as a Restate Virtual Object for automatic state persistence. |
| Microservices    | Payment state machines | [code](patterns-use-cases/src/main/java/my/example/statemachinepayments/PaymentProcessor.java) | [README](patterns-use-cases/README.md#microservices-payment-state-machine)                                                                      | Advanced                       | State machine example that tracks a payment process, ensuring consistent processing and cancellations.      |
| Async tasks      | (Delayed) Task Queue | [code](patterns-use-cases/src/main/java/my/example/queue/TaskSubmitter.java)                   | [README](patterns-use-cases/README.md#async-tasks-delayed-tasks-queue)                                                                          | Basic                          | Use Restate as a queue. Schedule tasks for now or later and ensure the task is only executed once.          |
| Async tasks      | Parallelizing work | [code](patterns-use-cases/src/main/java/my/example/parallelizework/FanOutWorker.java)          | [README](patterns-use-cases/README.md#async-tasks-parallelizing-work)                                                                           | Intermediate                   | Execute a list of tasks in parallel and then gather their result.                                           |
| Async tasks      | Slow async data upload | [code](patterns-use-cases/src/main/java/my/example/dataupload/UploadClient.java)               | [README](patterns-use-cases/README.md#async-tasks-async-data-upload)                                                                            | Intermediate                   | Kick of a synchronous task (e.g. data upload) and turn it into an asynchronous one if it takes too long.    |
| Async tasks      | Payments: async signals | [code](patterns-use-cases/src/main/java/my/example/signalspayments/PaymentService.java)        | [README](patterns-use-cases/README.md#async-tasks-payment-signals---combining-sync-and-async-webhook-responses-from-stripe)                     | Advanced                       | Handling async payment callbacks for slow payments, with Stripe.                                            |
| Event processing | Transactional handlers | [code](patterns-use-cases/src/main/java/my/example/eventtransactions/UserFeed.java)            | [README](patterns-use-cases/README.md#event-processing-transactional-handlers-with-durable-side-effects-and-timers) | Basic                          | Processing events (from Kafka) to update various downstream systems in a transactional way.                 |
| Event processing | Enriching streams | [code](patterns-use-cases/src/main/java/my/example/eventenrichment/PackageTracker.java)        | [README](patterns-use-cases/README.md#event-processing-event-enrichment)                                                                        | Basic                          | Stateful functions/actors connected to Kafka and callable over RPC.                                         |

## Integrations

Examples integrating Restate with other tools and frameworks:

| Name / Link                                                    | Description                                      |
|----------------------------------------------------------------|--------------------------------------------------|
| [Spring Boot + Spring JPA](integrations/java-spring) | Reading and writing to Postgres with Spring JPA. |


## End-to-End Applications

Complete applications built with Restate:

| Name/Link                                                                  | Description                                                                                                                                                                                                                                                           |
|----------------------------------------------------------------------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| [Food Ordering App](end-to-end-applications/food-ordering)                 | A food delivery service (like DoorDash) that manages orders, restaurants, payments, and delivery drivers. The example mixes workflows (ordering) and stateful microservices (driver management), and uses Kafka as an event source for updates from delivery drivers. |


## Templates

Starter templates for new projects:

| Name / Link                                                             |
|-------------------------------------------------------------------------|
| [Java - Gradle Template](templates/java-gradle)                         |
| [Java - Maven Template](templates/java-maven)                           |
| [Java - Maven - Quarkus Workers Template](templates/java-maven-quarkus) |
| [Java - Maven - Spring Boot](templates/java-maven-spring-boot)          |

## Tutorials

Step-by-step guides to learn Restate:

| Name / Link                                       | Description                                                                                                         |
|---------------------------------------------------|---------------------------------------------------------------------------------------------------------------------|
| [Tour of Restate](tutorials/tour-of-restate-java) | An introduction to the SDK features as described in the [documentation](https://docs.restate.dev/get_started/tour). |



