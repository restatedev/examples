# Kotlin Example Catalog

## Basics

- **[Services - Durable Execution](basics)**: Making code resilient to failures via automatic retries and recovery of previously finished actions. [<img src="https://raw.githubusercontent.com/restatedev/img/refs/heads/main/play-button.svg" width="16" height="16">](basics/src/main/kotlin/durable_execution/SubscriptionService.kt)
- **[Durable Building Blocks](basics)**: Restate turns familiar programming constructs into recoverable, distributed building blocks. Discover what you can do with the SDK. [<img src="https://raw.githubusercontent.com/restatedev/img/refs/heads/main/play-button.svg" width="16" height="16">](basics/src/main/kotlin/building_blocks/MyService.kt)
- **[Virtual Objects](basics)**: Stateful services with access to long-lasting, consistent K/V state.  [<img src="https://raw.githubusercontent.com/restatedev/img/refs/heads/main/play-button.svg" width="16" height="16">](basics/src/main/kotlin/virtual_objects/GreeterObject.kt)
- **[Workflows](basics)**: Durable sequences of steps that can be queried, signaled and awaited. [<img src="https://raw.githubusercontent.com/restatedev/img/refs/heads/main/play-button.svg" width="16" height="16">](basics/src/main/kotlin/workflows/SignupWorkflow.kt)

## Use Cases and Patterns

#### Orchestration patterns
- **[Sagas](patterns-use-cases/README.md#sagas)**: Preserve consistency by tracking undo actions and running them when code fails halfway through. [<img src="https://raw.githubusercontent.com/restatedev/img/refs/heads/main/play-button.svg" width="16" height="16">](patterns-use-cases/src/main/kotlin/my/example/sagas/BookingWorkflow.kt)

#### Event processing
- **[Transactional Event Processing](patterns-use-cases/README.md#transactional-event-processing)**: Processing events (from Kafka) to update various downstream systems in a transactional way. [<img src="https://raw.githubusercontent.com/restatedev/img/refs/heads/main/play-button.svg" width="16" height="16">](patterns-use-cases/src/main/kotlin/my/example/eventtransactions/UserFeed.kt)
- **[Event Enrichment / Joins](patterns-use-cases/README.md#event-enrichment--joins)**: Stateful functions/actors connected to Kafka and callable over RPC. [<img src="https://raw.githubusercontent.com/restatedev/img/refs/heads/main/play-button.svg" width="16" height="16">](patterns-use-cases/src/main/kotlin/my/example/eventenrichment/PackageTracker.kt)

## Integrations

Examples integrating Restate with other tools and frameworks:

- **[AWS Lambda + CDK](integrations/kotlin-gradle-lambda-cdk)**: Sample project deploying a Kotlin-based Restate service to AWS Lambda using the AWS Cloud Development Kit (CDK).

## End-to-End Applications

Complete applications built with Restate:

- **[Food Ordering App](end-to-end-applications/food-ordering)**: A food delivery service (like DoorDash) that manages orders, restaurants, payments, and delivery drivers. The example mixes workflows (ordering) and stateful microservices (driver management), and uses Kafka as an event source for updates from delivery drivers.
- **[Kotlin Multiplatform Todo App](end-to-end-applications/kmp-android-todo-app)**: Kotlin multiplatform example for a Todo app using Restate as backend.

## Templates

Starter templates for new projects:

- **[Kotlin - Gradle Template](templates/kotlin-gradle)**